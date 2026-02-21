import { PrismaClient, TripMessage, MessageReaction, MessageReadReceipt } from '@prisma/client';

export type { TripMessage, MessageReaction, MessageReadReceipt };

export interface CreateMessageInput {
  tripId: string;
  userId: string;
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

  async createMessage(data: CreateMessageInput): Promise<TripMessage & { mentions: ParsedMention[] }> {
    const tripMembers = await this.prisma.tripMember.findMany({
      where: { tripId: data.tripId },
      include: { user: true },
    });

    const mentions = this.parseMentions(data.content, tripMembers);

    const message = await this.prisma.tripMessage.create({
      data: {
        tripId: data.tripId,
        userId: data.userId,
        content: data.content,
        messageType: data.messageType || 'TEXT',
      },
    });

    return { ...message, mentions };
  }

  async getTripMessages(tripId: string, limit = 50, beforeId?: string): Promise<TripMessage[]> {
    return this.prisma.tripMessage.findMany({
      where: {
        tripId,
        ...(beforeId ? { id: { lt: beforeId } } : {}),
      },
      include: {
        user: {
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

  async getMessageById(messageId: string): Promise<TripMessage | null> {
    return this.prisma.tripMessage.findUnique({
      where: { id: messageId },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
        reactions: true,
      },
    });
  }

  async editMessage(messageId: string, userId: string, newContent: string): Promise<TripMessage> {
    const message = await this.prisma.tripMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.userId !== userId) {
      throw new Error('Not authorized to edit this message');
    }

    const editedMessage = await this.prisma.tripMessage.create({
      data: {
        tripId: message.tripId,
        userId: message.userId,
        content: newContent,
        messageType: message.messageType,
        parentId: messageId,
      },
    });

    await this.prisma.tripMessage.update({
      where: { id: messageId },
      data: { editedAt: new Date() },
    });

    return editedMessage;
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.prisma.tripMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.userId !== userId) {
      throw new Error('Not authorized to delete this message');
    }

    await this.prisma.tripMessage.delete({
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
    const messages = await this.prisma.tripMessage.findMany({
      where: { tripId },
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
    const totalMessages = await this.prisma.tripMessage.count({
      where: { tripId },
    });

    const readCount = await this.prisma.messageReadReceipt.count({
      where: {
        message: { tripId },
        userId,
      },
    });

    return totalMessages - readCount;
  }

  async createSystemMessage(tripId: string, content: string): Promise<TripMessage> {
    return this.prisma.tripMessage.create({
      data: {
        tripId,
        userId: 'system',
        content,
        messageType: 'SYSTEM',
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
}
