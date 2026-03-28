import { getPrisma } from '@/lib/prisma';
import { notificationService } from '@/services/notification.service';
import { NotificationCategory, NotificationReferenceType } from '@prisma/client';

export class MessageService {
  private prisma = getPrisma();

  async createTripMessage(tripId: string, senderId: string, content: string, messageType = 'TEXT', mentions: string[] = [], replyToId?: string) {
    const message = await this.prisma.message.create({
      data: { tripId, senderId, content, messageType: messageType as any, mentions, replyToId },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        replyTo: { select: { id: true, content: true, sender: { select: { id: true, name: true } } } },
      },
    });

    // Get trip members for notifications
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: {
          where: { status: 'CONFIRMED', userId: { not: senderId } },
          select: { userId: true },
        },
      },
    });

    // Notify mentioned users
    if (mentions && mentions.length > 0) {
      const sender = message.sender;
      for (const mentionedUserId of mentions) {
        if (mentionedUserId !== senderId) {
          await notificationService.createNotification({
            userId: mentionedUserId,
            category: NotificationCategory.CHAT,
            title: 'You were mentioned',
            body: '@' + sender.name + ' mentioned you in "' + (trip?.name || 'a trip') + '"',
            referenceId: tripId,
            referenceType: NotificationReferenceType.MESSAGE,
            link: '/trip/' + tripId + '/chat',
          });
        }
      }
    }

    // Send trip chat notification (non-mention) to all other members
    // The notificationService batches these internally if multiple messages come in
    if (trip) {
      const otherMemberIds = trip.members.map(m => m.userId);
      for (const memberId of otherMemberIds) {
        if (!mentions?.includes(memberId)) {
          await notificationService.createTripChatNotification(tripId, memberId, message.id);
        }
      }
    }

    return message;
  }

  async createDmMessage(conversationId: string, senderId: string, content: string, messageType = 'TEXT', mentions: string[] = [], replyToId?: string) {
    const message = await this.prisma.message.create({
      data: { conversationId, senderId, content, messageType: messageType as any, mentions, replyToId },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });

    await this.prisma.dmConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Get conversation participants
    const conversation = await this.prisma.dmConversation.findUnique({
      where: { id: conversationId },
      include: { participants: { select: { id: true, name: true } } },
    });

    // Notify other participant about new DM
    if (conversation) {
      for (const participant of conversation.participants) {
        if (participant.id !== senderId && !mentions?.includes(participant.id)) {
          await notificationService.createNotification({
            userId: participant.id,
            category: NotificationCategory.CHAT,
            title: 'New Direct Message',
            body: '@' + message.sender.name + ': ' + content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            referenceId: conversationId,
            referenceType: NotificationReferenceType.MESSAGE,
            link: '/messages/' + conversationId,
          });
        }
      }
    }

    // Notify mentioned users
    if (mentions && mentions.length > 0) {
      const sender = message.sender;
      if (conversation) {
        for (const participant of conversation.participants) {
          if (mentions.includes(participant.id) && participant.id !== senderId) {
            await notificationService.createNotification({
              userId: participant.id,
              category: NotificationCategory.CHAT,
              title: 'You were mentioned',
              body: '@' + sender.name + ' mentioned you in a DM',
              referenceId: conversationId,
              referenceType: NotificationReferenceType.MESSAGE,
              link: '/messages/' + conversationId,
            });
          }
        }
      }
    }

    return message;
  }

  async getTripMessages(tripId: string, limit = 30, before?: Date) {
    return this.prisma.message.findMany({
      where: { tripId, deletedAt: null, createdAt: before ? { lt: before } : undefined },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        replies: { take: 3, include: { sender: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getDmMessages(conversationId: string, limit = 30, before?: Date) {
    return this.prisma.message.findMany({
      where: { conversationId, deletedAt: null, createdAt: before ? { lt: before } : undefined },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async updateMessage(messageId: string, data: { content?: string; mentions?: string[]; reactions?: Record<string, string[]> }) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { ...data, editedAt: data.content ? new Date() : undefined },
    });
  }

  async deleteMessage(messageId: string) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), content: '[Message deleted]' },
    });
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { reactions: true, senderId: true, tripId: true, conversationId: true },
    });
    if (!message) { throw new Error('Message not found'); }

    const reactions = (message.reactions as Record<string, string[]>) || {};
    if (!reactions[emoji]) reactions[emoji] = [];
    if (!reactions[emoji].includes(userId)) {
      reactions[emoji].push(userId);
      if (message.senderId !== userId) {
        const trip = message.tripId
          ? await this.prisma.trip.findUnique({ where: { id: message.tripId }, select: { name: true } })
          : null;
        await notificationService.createNotification({
          userId: message.senderId,
          category: NotificationCategory.CHAT,
          title: 'Reaction on your message',
          body: emoji + ' reaction on your message in "' + (trip?.name || 'chat') + '"',
          referenceId: message.tripId || message.conversationId || messageId,
          referenceType: NotificationReferenceType.MESSAGE,
          link: message.tripId ? '/trip/' + message.tripId + '/chat' : '/messages/' + message.conversationId,
        });
      }
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { reactions: reactions as any },
    });
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId }, select: { reactions: true } });
    if (!message) { throw new Error('Message not found'); }
    const reactions = (message.reactions as Record<string, string[]>) || {};
    if (reactions[emoji]) {
      reactions[emoji] = reactions[emoji].filter((id) => id !== userId);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    }
    return this.prisma.message.update({ where: { id: messageId }, data: { reactions: reactions as any } });
  }

  async markAsRead(messageId: string, userId: string) {
    return this.prisma.messageReadReceipt.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: { readAt: new Date() },
      create: { messageId, userId, readAt: new Date() },
    });
  }
}

export const messageService = new MessageService();
