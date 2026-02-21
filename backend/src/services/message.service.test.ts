import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MessageService } from './message.service';

const mockPrisma = {
  tripMessage: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  tripMember: {
    findMany: vi.fn(),
  },
  messageReaction: {
    upsert: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
  },
  messageReadReceipt: {
    upsert: vi.fn(),
    createMany: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
  },
};

const mockPrismaClient = mockPrisma as any;

describe('MessageService', () => {
  let messageService: MessageService;

  beforeEach(() => {
    vi.resetAllMocks();
    messageService = new MessageService(mockPrismaClient);
  });

  describe('parseMentions', () => {
    it('should parse @everyone mention', () => {
      const tripMembers = [
        { userId: 'user-1', user: { name: 'John Doe' } },
        { userId: 'user-2', user: { name: 'Jane Smith' } },
      ];

      const result = messageService.parseMentions('Hello @everyone!', tripMembers as any);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('everyone');
      expect(result[0].id).toBe('everyone');
    });

    it('should parse user mentions by name', () => {
      const tripMembers = [
        { userId: 'user-1', user: { name: 'John Doe' } },
        { userId: 'user-2', user: { name: 'Jane Smith' } },
      ];

      const result = messageService.parseMentions('Hey @John, what do you think?', tripMembers as any);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('user');
      expect(result[0].id).toBe('user-1');
    });

    it('should parse multiple mentions', () => {
      const tripMembers = [
        { userId: 'user-1', user: { name: 'John Doe' } },
        { userId: 'user-2', user: { name: 'Jane Smith' } },
      ];

      const result = messageService.parseMentions('@John and @Jane @everyone', tripMembers as any);

      expect(result).toHaveLength(3);
    });

    it('should return empty array for no mentions', () => {
      const tripMembers = [
        { userId: 'user-1', user: { name: 'John Doe' } },
      ];

      const result = messageService.parseMentions('Hello everyone!', tripMembers as any);

      expect(result).toHaveLength(0);
    });

    it('should handle names with spaces', () => {
      const tripMembers = [
        { userId: 'user-1', user: { name: 'John Doe' } },
      ];

      const result = messageService.parseMentions('Hey @JohnDoe!', tripMembers as any);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user-1');
    });
  });

  describe('createMessage', () => {
    it('should create a message with mentions', async () => {
      const messageData = {
        tripId: 'trip-1',
        userId: 'user-1',
        content: 'Hello @everyone!',
      };

      mockPrisma.tripMember.findMany.mockResolvedValue([
        { userId: 'user-1', user: { name: 'John' } },
        { userId: 'user-2', user: { name: 'Jane' } },
      ]);

      mockPrisma.tripMessage.create.mockResolvedValue({
        id: 'msg-1',
        ...messageData,
        messageType: 'TEXT',
        createdAt: new Date(),
      });

      const result = await messageService.createMessage(messageData);

      expect(result.content).toBe('Hello @everyone!');
      expect(result.mentions).toHaveLength(1);
      expect(mockPrisma.tripMessage.create).toHaveBeenCalled();
    });
  });

  describe('getTripMessages', () => {
    it('should return messages for a trip', async () => {
      const messages = [
        { id: 'msg-1', tripId: 'trip-1', content: 'Hello' },
        { id: 'msg-2', tripId: 'trip-1', content: 'Hi there' },
      ];
      mockPrisma.tripMessage.findMany.mockResolvedValue(messages);

      const result = await messageService.getTripMessages('trip-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.tripMessage.findMany).toHaveBeenCalledWith({
        where: { tripId: 'trip-1' },
        include: { 
          user: { select: { id: true, name: true, avatarUrl: true } },
          reactions: true,
          _count: { select: { edits: true, readReceipts: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should respect limit parameter', async () => {
      mockPrisma.tripMessage.findMany.mockResolvedValue([]);

      await messageService.getTripMessages('trip-1', 10);

      expect(mockPrisma.tripMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });
  });

  describe('editMessage', () => {
    it('should edit own message', async () => {
      mockPrisma.tripMessage.findUnique.mockResolvedValue({
        id: 'msg-1',
        userId: 'user-1',
        tripId: 'trip-1',
        content: 'Old content',
        messageType: 'TEXT',
      });

      mockPrisma.tripMessage.create.mockResolvedValue({
        id: 'msg-2',
        userId: 'user-1',
        tripId: 'trip-1',
        content: 'New content',
        messageType: 'TEXT',
        parentId: 'msg-1',
      });

      mockPrisma.tripMessage.update.mockResolvedValue({});

      const result = await messageService.editMessage('msg-1', 'user-1', 'New content');

      expect(result.content).toBe('New content');
      expect(mockPrisma.tripMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: { editedAt: expect.any(Date) },
      });
    });

    it('should throw when editing another user message', async () => {
      mockPrisma.tripMessage.findUnique.mockResolvedValue({
        id: 'msg-1',
        userId: 'user-1',
        tripId: 'trip-1',
      });

      await expect(
        messageService.editMessage('msg-1', 'user-2', 'New content')
      ).rejects.toThrow('Not authorized to edit this message');
    });

    it('should throw when message not found', async () => {
      mockPrisma.tripMessage.findUnique.mockResolvedValue(null);

      await expect(
        messageService.editMessage('msg-1', 'user-1', 'New content')
      ).rejects.toThrow('Message not found');
    });
  });

  describe('deleteMessage', () => {
    it('should delete own message', async () => {
      mockPrisma.tripMessage.findUnique.mockResolvedValue({
        id: 'msg-1',
        userId: 'user-1',
        tripId: 'trip-1',
      });
      mockPrisma.tripMessage.delete.mockResolvedValue({} as any);

      await messageService.deleteMessage('msg-1', 'user-1');

      expect(mockPrisma.tripMessage.delete).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
      });
    });

    it('should throw when deleting another user message', async () => {
      mockPrisma.tripMessage.findUnique.mockResolvedValue({
        id: 'msg-1',
        userId: 'user-1',
        tripId: 'trip-1',
      });

      await expect(
        messageService.deleteMessage('msg-1', 'user-2')
      ).rejects.toThrow('Not authorized to delete this message');
    });

    it('should throw when message not found', async () => {
      mockPrisma.tripMessage.findUnique.mockResolvedValue(null);

      await expect(
        messageService.deleteMessage('msg-1', 'user-1')
      ).rejects.toThrow('Message not found');
    });
  });

  describe('addReaction', () => {
    it('should add reaction to message', async () => {
      mockPrisma.messageReaction.upsert.mockResolvedValue({
        id: 'reaction-1',
        messageId: 'msg-1',
        userId: 'user-1',
        emoji: '👍',
      });

      const result = await messageService.addReaction('msg-1', 'user-1', '👍');

      expect(result.emoji).toBe('👍');
      expect(mockPrisma.messageReaction.upsert).toHaveBeenCalledWith({
        where: {
          messageId_userId_emoji: {
            messageId: 'msg-1',
            userId: 'user-1',
            emoji: '👍',
          },
        },
        create: {
          messageId: 'msg-1',
          userId: 'user-1',
          emoji: '👍',
        },
        update: {},
      });
    });
  });

  describe('removeReaction', () => {
    it('should remove reaction from message', async () => {
      mockPrisma.messageReaction.delete.mockResolvedValue({} as any);

      await messageService.removeReaction('msg-1', 'user-1', '👍');

      expect(mockPrisma.messageReaction.delete).toHaveBeenCalledWith({
        where: {
          messageId_userId_emoji: {
            messageId: 'msg-1',
            userId: 'user-1',
            emoji: '👍',
          },
        },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark message as read', async () => {
      mockPrisma.messageReadReceipt.upsert.mockResolvedValue({
        id: 'receipt-1',
        messageId: 'msg-1',
        userId: 'user-1',
        readAt: new Date(),
      });

      const result = await messageService.markAsRead('msg-1', 'user-1');

      expect(result.messageId).toBe('msg-1');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all messages in trip as read', async () => {
      mockPrisma.tripMessage.findMany.mockResolvedValue([
        { id: 'msg-1' },
        { id: 'msg-2' },
        { id: 'msg-3' },
      ]);
      mockPrisma.messageReadReceipt.createMany.mockResolvedValue({ count: 3 });

      const count = await messageService.markAllAsRead('trip-1', 'user-1');

      expect(count).toBe(3);
    });

    it('should return 0 when no messages', async () => {
      mockPrisma.tripMessage.findMany.mockResolvedValue([]);

      const count = await messageService.markAllAsRead('trip-1', 'user-1');

      expect(count).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should return correct unread count', async () => {
      mockPrisma.tripMessage.count.mockResolvedValue(10);
      mockPrisma.messageReadReceipt.count.mockResolvedValue(4);

      const count = await messageService.getUnreadCount('trip-1', 'user-1');

      expect(count).toBe(6);
    });
  });

  describe('createSystemMessage', () => {
    it('should create system message', async () => {
      mockPrisma.tripMessage.create.mockResolvedValue({
        id: 'msg-1',
        tripId: 'trip-1',
        userId: 'system',
        content: 'Trip confirmed!',
        messageType: 'SYSTEM',
      });

      const result = await messageService.createSystemMessage('trip-1', 'Trip confirmed!');

      expect(result.content).toBe('Trip confirmed!');
      expect(result.messageType).toBe('SYSTEM');
      expect(mockPrisma.tripMessage.create).toHaveBeenCalledWith({
        data: {
          tripId: 'trip-1',
          userId: 'system',
          content: 'Trip confirmed!',
          messageType: 'SYSTEM',
        },
      });
    });
  });

  describe('getMentionedUsers', () => {
    it('should return all confirmed trip members', async () => {
      const members = [
        { userId: 'user-1', user: { id: 'user-1', name: 'John' } },
        { userId: 'user-2', user: { id: 'user-2', name: 'Jane' } },
      ];
      mockPrisma.tripMember.findMany.mockResolvedValue(members);

      const result = await messageService.getMentionedUsers('trip-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ userId: 'user-1', name: 'John' });
    });
  });

  describe('getReactions', () => {
    it('should return reactions with user info', async () => {
      const reactions = [
        { id: 'r-1', messageId: 'msg-1', userId: 'user-1', emoji: '👍', user: { id: 'user-1', name: 'John', avatarUrl: null } },
      ];
      mockPrisma.messageReaction.findMany.mockResolvedValue(reactions);

      const result = await messageService.getReactions('msg-1');

      expect(result).toHaveLength(1);
      expect(result[0].emoji).toBe('👍');
      expect(mockPrisma.messageReaction.findMany).toHaveBeenCalledWith({
        where: { messageId: 'msg-1' },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      });
    });
  });

  describe('getReadReceipts', () => {
    it('should return read receipts with user info', async () => {
      const receipts = [
        { id: 'receipt-1', messageId: 'msg-1', userId: 'user-1', readAt: new Date(), user: { id: 'user-1', name: 'John', avatarUrl: null } },
      ];
      mockPrisma.messageReadReceipt.findMany.mockResolvedValue(receipts);

      const result = await messageService.getReadReceipts('msg-1');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
      expect(mockPrisma.messageReadReceipt.findMany).toHaveBeenCalledWith({
        where: { messageId: 'msg-1' },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      });
    });
  });

  describe('getMessageById', () => {
    it('should return message by id with reactions', async () => {
      const message = {
        id: 'msg-1',
        content: 'Test',
        userId: 'user-1',
        reactions: [{ emoji: '👍' }],
        user: { id: 'user-1', name: 'John', avatarUrl: null },
      };
      mockPrisma.tripMessage.findUnique.mockResolvedValue(message as any);

      const result = await messageService.getMessageById('msg-1');

      expect(result).toEqual(message);
      expect(mockPrisma.tripMessage.findUnique).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          reactions: true,
        },
      });
    });

    it('should return null for non-existent message', async () => {
      mockPrisma.tripMessage.findUnique.mockResolvedValue(null);

      const result = await messageService.getMessageById('non-existent');

      expect(result).toBeNull();
    });
  });
});
