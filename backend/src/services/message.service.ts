import { PrismaClient, Message, TripMessage, DirectMessage, MessageReaction, MessageReadReceipt } from '@prisma/client';

export type { Message, TripMessage, DirectMessage, MessageReaction, MessageReadReceipt };

export interface CreateMessageInput {
  tripId: string;
  userId: string;
  content: string;
  messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'SYSTEM';
}

export interface CreateDirectMessageInput {
  senderId: string;
  receiverId: string;
  content: string;
  messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'SYSTEM';
}

export interface ParsedMention {
  type: 'user' | 'everyone';
  id: string;
  startIndex: number;
  endIndex: number;
}

export class MessageService {
  constructor(private prisma: PrismaClient) {}

  parseMentions(content: string, tripMembers: { userId: string; user: { name: string } }[]): ParsedMention[] {
    const mentions: ParsedMention[] = [];
    const mentionRegex = /@(\w+)/g;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionText = match[1].toLowerCase();
      
      if (mentionText === 'everyone') {
        mentions.push({
          type: 'everyone',
          id: 'everyone',
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      } else {
        const member = tripMembers.find(m => 
          m.user.name.toLowerCase().replace(/\s+/g, '').includes(mentionText) ||
          m.user.name.toLowerCase().split(' ')[0] === mentionText
        );
        
        if (member) {
          mentions.push({
            type: 'user',
            id: member.userId,
            startIndex: match.index,
            endIndex: match.index + match[0].length,
          });
        }
      }
    }

    return mentions;
  }

  async createMessage(data: CreateMessageInput): Promise<Message & { mentions: ParsedMention[] }> {
    const tripMembers = await this.prisma.tripMember.findMany({
      where: { tripId: data.tripId },
      include: { user: true },
    });

    const mentions = this.parseMentions(data.content, tripMembers);

    const message = await this.prisma.message.create({
      data: {
        senderId: data.userId,
        content: data.content,
        messageType: data.messageType || 'TEXT',
        tripMessage: {
          create: {
            tripId: data.tripId,
          },
        },
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return { ...message, mentions };
  }

  async getTripMessages(tripId: string, limit = 50, beforeId?: string): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        tripMessage: {
          tripId,
        },
        ...(beforeId ? { id: { lt: beforeId } } : {}),
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
        reactions: true,
        _count: {
          select: { edits: true, readReceipts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getMessageById(messageId: string): Promise<Message | null> {
    return this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
        reactions: true,
      },
    });
  }

  async editMessage(messageId: string, userId: string, newContent: string): Promise<Message> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { tripMessage: true, directMessage: true },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Not authorized to edit this message');
    }

    // Create new message as an edit
    const editedMessage = await this.prisma.message.create({
      data: {
        senderId: message.senderId,
        content: newContent,
        messageType: message.messageType,
        parentId: messageId,
        // Reuse original container if applicable
        ...(message.tripMessage ? {
          tripMessage: {
            create: { tripId: message.tripMessage.tripId }
          }
        } : {}),
        ...(message.directMessage ? {
          directMessage: {
            create: { receiverId: message.directMessage.receiverId }
          }
        } : {}),
      },
    });

    await this.prisma.message.update({
      where: { id: messageId },
      data: { editedAt: new Date() },
    });

    return editedMessage;
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Not authorized to delete this message');
    }

    await this.prisma.message.delete({
      where: { id: messageId },
    });
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<MessageReaction> {
    return this.prisma.messageReaction.upsert({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
      create: {
        messageId,
        userId,
        emoji,
      },
      update: {},
    });
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await this.prisma.messageReaction.delete({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });
  }

  async getReactions(messageId: string): Promise<(MessageReaction & { user: { id: string; name: string; avatarUrl: string | null } })[]> {
    return this.prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  async markAsRead(messageId: string, userId: string): Promise<MessageReadReceipt> {
    return this.prisma.messageReadReceipt.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      create: {
        messageId,
        userId,
        readAt: new Date(),
      },
      update: {
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(tripId: string, userId: string): Promise<number> {
    const messages = await this.prisma.message.findMany({
      where: { tripMessage: { tripId } },
      select: { id: true },
    });

    const messageIds = messages.map(m => m.id);
    
    if (messageIds.length === 0) return 0;

    const result = await this.prisma.messageReadReceipt.createMany({
      data: messageIds.map(messageId => ({
        messageId,
        userId,
        readAt: new Date(),
      })),
      skipDuplicates: true,
    });

    return result.count;
  }

  async getReadReceipts(messageId: string): Promise<(MessageReadReceipt & { user: { id: string; name: string; avatarUrl: string | null } })[]> {
    return this.prisma.messageReadReceipt.findMany({
      where: { messageId },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  async getUnreadCount(tripId: string, userId: string): Promise<number> {
    const totalMessages = await this.prisma.message.count({
      where: { tripMessage: { tripId } },
    });

    const readCount = await this.prisma.messageReadReceipt.count({
      where: {
        message: { tripMessage: { tripId } },
        userId,
      },
    });

    return totalMessages - readCount;
  }

  async createSystemMessage(tripId: string, content: string): Promise<Message> {
    return this.prisma.message.create({
      data: {
        senderId: 'system',
        content,
        messageType: 'SYSTEM',
        tripMessage: {
          create: { tripId }
        }
      },
    });
  }

  async getMentionedUsers(tripId: string): Promise<{ userId: string; name: string }[]> {
    const members = await this.prisma.tripMember.findMany({
      where: { tripId, status: 'CONFIRMED' },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return members.map(m => ({
      userId: m.user.id,
      name: m.user.name,
    }));
  }

  // Direct Messages (using containers)
  async getDirectMessages(user1Id: string, user2Id: string, limit = 50): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: user1Id, directMessage: { receiverId: user2Id } },
          { senderId: user2Id, directMessage: { receiverId: user1Id } },
        ],
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
        directMessage: {
          include: {
            receiver: {
              select: { id: true, name: true, avatarUrl: true },
            }
          }
        },
        reactions: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async sendDirectMessage(data: CreateDirectMessageInput): Promise<Message> {
    return this.prisma.message.create({
      data: {
        senderId: data.senderId,
        content: data.content,
        messageType: data.messageType || 'TEXT',
        directMessage: {
          create: {
            receiverId: data.receiverId
          }
        }
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
        directMessage: {
          include: {
            receiver: {
              select: { id: true, name: true, avatarUrl: true },
            }
          }
        },
      },
    });
  }
}
