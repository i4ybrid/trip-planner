import prisma from '@/lib/prisma';

export class MessageService {
  async createTripMessage(tripId: string, senderId: string, content: string, messageType = 'TEXT', mentions: string[] = [], replyToId?: string) {
    const message = await prisma.message.create({
      data: {
        tripId,
        senderId,
        content,
        messageType: messageType as any,
        mentions,
        replyToId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return message;
  }

  async createDmMessage(conversationId: string, senderId: string, content: string, messageType = 'TEXT', mentions: string[] = [], replyToId?: string) {
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        messageType: messageType as any,
        mentions,
        replyToId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update conversation last message time
    await prisma.dmConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async getTripMessages(tripId: string, limit = 30, before?: Date) {
    return prisma.message.findMany({
      where: {
        tripId,
        deletedAt: null,
        createdAt: before ? { lt: before } : undefined,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        replies: {
          take: 3,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getDmMessages(conversationId: string, limit = 30, before?: Date) {
    return prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
        createdAt: before ? { lt: before } : undefined,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async updateMessage(messageId: string, data: { content?: string; mentions?: string[]; reactions?: Record<string, string[]> }) {
    return prisma.message.update({
      where: { id: messageId },
      data: {
        ...data,
        editedAt: data.content ? new Date() : undefined,
      },
    });
  }

  async deleteMessage(messageId: string) {
    return prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        content: '[Message deleted]',
      },
    });
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { reactions: true },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    const reactions = (message.reactions as Record<string, string[]>) || {};

    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    if (!reactions[emoji].includes(userId)) {
      reactions[emoji].push(userId);
    }

    return prisma.message.update({
      where: { id: messageId },
      data: { reactions: reactions as any },
    });
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { reactions: true },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    const reactions = (message.reactions as Record<string, string[]>) || {};

    if (reactions[emoji]) {
      reactions[emoji] = reactions[emoji].filter((id) => id !== userId);

      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    }

    return prisma.message.update({
      where: { id: messageId },
      data: { reactions: reactions as any },
    });
  }

  async markAsRead(messageId: string, userId: string) {
    return prisma.messageReadReceipt.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        messageId,
        userId,
        readAt: new Date(),
      },
    });
  }

  async getUnreadCount(conversationId: string | null, tripId: string | null, userId: string) {
    const messages = await prisma.message.count({
      where: {
        conversationId,
        tripId,
        deletedAt: null,
        senderId: { not: userId },
        readReceipts: {
          none: {
            userId,
          },
        },
      },
    });

    return messages;
  }
}

export const messageService = new MessageService();
