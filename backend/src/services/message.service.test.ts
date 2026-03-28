import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MessageService } from './message.service';
import { createStubs } from '@/lib/stubs';
import { setPrisma, resetPrisma } from '@/lib/prisma-client';

describe('MessageService', () => {
  let messageService: MessageService;
  let stubs: ReturnType<typeof createStubs>;

  beforeEach(() => {
    stubs = createStubs();
    setPrisma(stubs.prisma.getImplementation() as any);
    messageService = new MessageService();
  });

  afterEach(() => {
    resetPrisma();
  });

  describe('createTripMessage', () => {
    it('should create message with correct fields', async () => {
      const prisma = stubs.prisma.getImplementation();

      const message = await messageService.createTripMessage(
        'trip-123',
        'user-1',
        'Hello everyone!',
        'TEXT',
        [],
        undefined
      );

      expect(message.tripId).toBe('trip-123');
      expect(message.senderId).toBe('user-1');
      expect(message.content).toBe('Hello everyone!');
      expect(message.messageType).toBe('TEXT');
      expect(message.mentions).toEqual([]);

      // Verify it was stored
      const stored = await prisma.message.findUnique({ where: { id: message.id } });
      expect(stored).toBeDefined();
    });

    it('should include sender info in response', async () => {
      const prisma = stubs.prisma.getImplementation();
      await prisma.user.create({
        data: { id: 'user-sender', email: 'sender@test.com', name: 'Sender Name', passwordHash: 'x' },
      });

      const message = await messageService.createTripMessage(
        'trip-1',
        'user-sender',
        'Test message',
        'TEXT'
      );

      expect(message.sender).toBeDefined();
      expect(message.sender!.id).toBe('user-sender');
      expect(message.sender!.name).toBe('Sender Name');
    });

    it('should handle mentions array', async () => {
      const message = await messageService.createTripMessage(
        'trip-1',
        'user-1',
        'Hey @user-2 and @user-3!',
        'TEXT',
        ['user-2', 'user-3']
      );

      expect(message.mentions).toEqual(['user-2', 'user-3']);
    });

    it('should set replyTo when replyToId is provided', async () => {
      const prisma = stubs.prisma.getImplementation();
      await prisma.user.create({
        data: { id: 'user-1', email: 'u1@test.com', name: 'User One', passwordHash: 'x' },
      });

      const originalMessage = await prisma.message.create({
        data: { tripId: 'trip-1', senderId: 'user-1', content: 'Original', messageType: 'TEXT' },
      });

      const reply = await messageService.createTripMessage(
        'trip-1',
        'user-1',
        'This is a reply',
        'TEXT',
        [],
        originalMessage.id
      );

      expect(reply.replyTo).toBeDefined();
      expect(reply.replyTo!.id).toBe(originalMessage.id);
      expect(reply.replyTo!.content).toBe('Original');
    });

    it('should default messageType to TEXT', async () => {
      const message = await messageService.createTripMessage(
        'trip-1',
        'user-1',
        'Just text'
      );

      expect(message.messageType).toBe('TEXT');
    });
  });

  describe('createDmMessage', () => {
    it('should create DM message with correct fields', async () => {
      const prisma = stubs.prisma.getImplementation();

      const message = await messageService.createDmMessage(
        'conv-123',
        'user-1',
        'Private message',
        'TEXT'
      );

      expect(message.conversationId).toBe('conv-123');
      expect(message.senderId).toBe('user-1');
      expect(message.content).toBe('Private message');
    });

    it('should update conversation lastMessageAt', async () => {
      const prisma = stubs.prisma.getImplementation();
      
      await prisma.dmConversation.create({
        data: {
          id: 'conv-update',
          participant1: 'user-1',
          participant2: 'user-2',
        },
      });

      const before = Date.now();
      await messageService.createDmMessage('conv-update', 'user-1', 'New message');
      const after = Date.now();

      const conv = await prisma.dmConversation.findUnique({ where: { id: 'conv-update' } });
      expect(conv!.lastMessageAt).toBeDefined();
      expect(conv!.lastMessageAt!.getTime()).toBeGreaterThanOrEqual(before);
      expect(conv!.lastMessageAt!.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe('getTripMessages', () => {
    it('should return messages for trip', async () => {
      const prisma = stubs.prisma.getImplementation();

      await prisma.message.create({
        data: { tripId: 'trip-get', senderId: 'user-1', content: 'Message 1', messageType: 'TEXT' },
      });
      await prisma.message.create({
        data: { tripId: 'trip-get', senderId: 'user-2', content: 'Message 2', messageType: 'TEXT' },
      });
      await prisma.message.create({
        data: { tripId: 'trip-other', senderId: 'user-1', content: 'Other Trip', messageType: 'TEXT' },
      });

      const result = await messageService.getTripMessages('trip-get');

      expect(result.length).toBe(2);
      result.forEach(m => expect(m.tripId).toBe('trip-get'));
    });

    it('should exclude deleted messages', async () => {
      const prisma = stubs.prisma.getImplementation();

      await prisma.message.create({
        data: { tripId: 'trip-del', senderId: 'user-1', content: 'Visible', messageType: 'TEXT', deletedAt: null },
      });
      await prisma.message.create({
        data: { tripId: 'trip-del', senderId: 'user-1', content: 'Deleted', messageType: 'TEXT', deletedAt: new Date() },
      });

      const result = await messageService.getTripMessages('trip-del');

      expect(result.length).toBe(1);
      expect(result[0].content).toBe('Visible');
    });

    it('should return messages in descending order', async () => {
      const prisma = stubs.prisma.getImplementation();

      const m1 = await prisma.message.create({
        data: { tripId: 'trip-order', senderId: 'user-1', content: 'First', messageType: 'TEXT' },
      });
      await new Promise(r => setTimeout(r, 10));
      const m2 = await prisma.message.create({
        data: { tripId: 'trip-order', senderId: 'user-1', content: 'Second', messageType: 'TEXT' },
      });

      const result = await messageService.getTripMessages('trip-order');

      expect(result[0].id).toBe(m2.id);
      expect(result[1].id).toBe(m1.id);
    });

    it('should respect limit parameter', async () => {
      const prisma = stubs.prisma.getImplementation();

      for (let i = 0; i < 10; i++) {
        await prisma.message.create({
          data: { tripId: 'trip-limit', senderId: 'user-1', content: `Message ${i}`, messageType: 'TEXT' },
        });
      }

      const result = await messageService.getTripMessages('trip-limit', 5);

      expect(result.length).toBe(5);
    });

    it('should return messages before specified date', async () => {
      const prisma = stubs.prisma.getImplementation();

      const m1 = await prisma.message.create({
        data: { tripId: 'trip-before', senderId: 'user-1', content: 'Old', messageType: 'TEXT', createdAt: new Date('2026-01-01') },
      });
      const m2 = await prisma.message.create({
        data: { tripId: 'trip-before', senderId: 'user-1', content: 'New', messageType: 'TEXT', createdAt: new Date('2026-06-01') },
      });

      const result = await messageService.getTripMessages('trip-before', 10, new Date('2026-03-01'));

      expect(result.length).toBe(1);
      expect(result[0].content).toBe('Old');
    });

    it('should include sender info', async () => {
      const prisma = stubs.prisma.getImplementation();
      await prisma.user.create({
        data: { id: 'user-sender', email: 's@test.com', name: 'Sender', passwordHash: 'x' },
      });

      await prisma.message.create({
        data: { tripId: 'trip-sender', senderId: 'user-sender', content: 'With Sender', messageType: 'TEXT' },
      });

      const result = await messageService.getTripMessages('trip-sender');

      expect(result[0].sender).toBeDefined();
      expect(result[0].sender!.id).toBe('user-sender');
    });
  });

  describe('addReaction', () => {
    it('should add reaction to message', async () => {
      const prisma = stubs.prisma.getImplementation();

      const message = await prisma.message.create({
        data: { tripId: 'trip-react', senderId: 'user-1', content: 'Test', messageType: 'TEXT', reactions: {} },
      });

      const result = await messageService.addReaction(message.id, 'user-2', '👍');

      const updated = await prisma.message.findUnique({ where: { id: message.id } });
      const reactions = updated!.reactions as Record<string, string[]>;
      expect(reactions['👍']).toContain('user-2');
    });

    it('should not add duplicate reaction from same user', async () => {
      const prisma = stubs.prisma.getImplementation();

      const message = await prisma.message.create({
        data: {
          tripId: 'trip-react-dup',
          senderId: 'user-1',
          content: 'Test',
          messageType: 'TEXT',
          reactions: { '👍': ['user-2'] },
        },
      });

      await messageService.addReaction(message.id, 'user-2', '👍');

      const updated = await prisma.message.findUnique({ where: { id: message.id } });
      const reactions = updated!.reactions as Record<string, string[]>;
      expect(reactions['👍'].length).toBe(1); // Still just one
    });

    it('should throw error if message not found', async () => {
      await expect(
        messageService.addReaction('nonexistent', 'user-1', '👍')
      ).rejects.toThrow('Message not found');
    });
  });

  describe('removeReaction', () => {
    it('should remove reaction from message', async () => {
      const prisma = stubs.prisma.getImplementation();

      const message = await prisma.message.create({
        data: {
          tripId: 'trip-remove-react',
          senderId: 'user-1',
          content: 'Test',
          messageType: 'TEXT',
          reactions: { '👍': ['user-2'] },
        },
      });

      await messageService.removeReaction(message.id, 'user-2', '👍');

      const updated = await prisma.message.findUnique({ where: { id: message.id } });
      const reactions = updated!.reactions as Record<string, string[]>;
      expect(reactions['👍']).toBeUndefined();
    });

    it('should remove emoji key when no users left for that emoji', async () => {
      const prisma = stubs.prisma.getImplementation();

      const message = await prisma.message.create({
        data: {
          tripId: 'trip-remove-last',
          senderId: 'user-1',
          content: 'Test',
          messageType: 'TEXT',
          reactions: { '👍': ['user-2'], '❤️': ['user-3'] },
        },
      });

      await messageService.removeReaction(message.id, 'user-2', '👍');

      const updated = await prisma.message.findUnique({ where: { id: message.id } });
      const reactions = updated!.reactions as Record<string, string[]>;
      expect(reactions['👍']).toBeUndefined();
      expect(reactions['❤️']).toContain('user-3');
    });

    it('should throw error if message not found', async () => {
      await expect(
        messageService.removeReaction('nonexistent', 'user-1', '👍')
      ).rejects.toThrow('Message not found');
    });
  });

  describe('deleteMessage', () => {
    it('should soft delete message', async () => {
      const prisma = stubs.prisma.getImplementation();

      const message = await prisma.message.create({
        data: { tripId: 'trip-del', senderId: 'user-1', content: 'To Delete', messageType: 'TEXT' },
      });

      const result = await messageService.deleteMessage(message.id);

      expect(result.deletedAt).toBeDefined();
      expect(result.content).toBe('[Message deleted]');

      // Message still exists in DB but is soft deleted
      const stored = await prisma.message.findUnique({ where: { id: message.id } });
      expect(stored).toBeDefined();
      expect(stored!.deletedAt).toBeDefined();
    });
  });

  describe('markAsRead', () => {
    it('should create read receipt', async () => {
      const prisma = stubs.prisma.getImplementation();

      const message = await prisma.message.create({
        data: { tripId: 'trip-read', senderId: 'user-1', content: 'Test', messageType: 'TEXT' },
      });

      const result = await messageService.markAsRead(message.id, 'user-2');

      expect(result.messageId).toBe(message.id);
      expect(result.userId).toBe('user-2');
      expect(result.readAt).toBeDefined();

      // Verify in DB
      const receipt = await prisma.messageReadReceipt.findUnique({
        where: { messageId_userId: { messageId: message.id, userId: 'user-2' } },
      });
      expect(receipt).toBeDefined();
    });

    it('should update existing read receipt', async () => {
      const prisma = stubs.prisma.getImplementation();

      const message = await prisma.message.create({
        data: { tripId: 'trip-read-update', senderId: 'user-1', content: 'Test', messageType: 'TEXT' },
      });

      // Create initial receipt
      await messageService.markAsRead(message.id, 'user-2');
      const before = Date.now();

      await new Promise(r => setTimeout(r, 10));

      // Update receipt
      await messageService.markAsRead(message.id, 'user-2');

      const receipt = await prisma.messageReadReceipt.findUnique({
        where: { messageId_userId: { messageId: message.id, userId: 'user-2' } },
      });
      expect(receipt!.readAt.getTime()).toBeGreaterThanOrEqual(before);
    });
  });

  describe('updateMessage', () => {
    it('should update message content', async () => {
      const prisma = stubs.prisma.getImplementation();

      const message = await prisma.message.create({
        data: { tripId: 'trip-upd', senderId: 'user-1', content: 'Original', messageType: 'TEXT' },
      });

      const result = await messageService.updateMessage(message.id, { content: 'Updated' });

      expect(result.content).toBe('Updated');
      expect(result.editedAt).toBeDefined();
    });

    it('should update mentions', async () => {
      const prisma = stubs.prisma.getImplementation();

      const message = await prisma.message.create({
        data: { tripId: 'trip-upd-mentions', senderId: 'user-1', content: 'Test', messageType: 'TEXT', mentions: [] },
      });

      const result = await messageService.updateMessage(message.id, { mentions: ['user-2', 'user-3'] });

      expect(result.mentions).toEqual(['user-2', 'user-3']);
    });

    it('should not set editedAt when only mentions change', async () => {
      const prisma = stubs.prisma.getImplementation();

      const message = await prisma.message.create({
        data: { tripId: 'trip-no-edit', senderId: 'user-1', content: 'Test', messageType: 'TEXT' },
      });

      const result = await messageService.updateMessage(message.id, { mentions: ['user-2'] });

      // editedAt should not be set when only mentions change
      expect(result.editedAt).toBeUndefined();
    });
  });
});
