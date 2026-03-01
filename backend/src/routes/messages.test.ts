import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app, server } from '../index';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const API_BASE = '/api';

describe('Messages API - Chat Pagination', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    testUserId = 'test-user-pagination';
    const passwordHash = await bcrypt.hash('password123', 10);
    
    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId,
        email: 'test-pagination@example.com',
        name: 'Test Pagination User',
        passwordHash,
      },
    });

    // Login to get auth token
    const loginResponse = await request(app)
      .post(`${API_BASE}/auth/login`)
      .send({
        email: 'test-pagination@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.data.token;
  });

  beforeEach(async () => {
    // Clean up messages before each test
    await prisma.message.deleteMany({
      where: {
        tripId: 'trip-pagination-test',
      },
    });

    // Create test trip if it doesn't exist
    await prisma.trip.upsert({
      where: { id: 'trip-pagination-test' },
      update: {},
      create: {
        id: 'trip-pagination-test',
        name: 'Pagination Test Trip',
        status: 'PLANNING',
        tripMasterId: testUserId,
      },
    });

    // Add user as trip member
    await prisma.tripMember.upsert({
      where: {
        tripId_userId: {
          tripId: 'trip-pagination-test',
          userId: testUserId,
        },
      },
      update: {},
      create: {
        tripId: 'trip-pagination-test',
        userId: testUserId,
        role: 'MASTER',
        status: 'CONFIRMED',
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.message.deleteMany({
      where: {
        tripId: 'trip-pagination-test',
      },
    });
    await prisma.tripMember.deleteMany({
      where: { tripId: 'trip-pagination-test' },
    });
    await prisma.trip.delete({
      where: { id: 'trip-pagination-test' },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
  });

  const createTestMessages = async (count: number, tripId: string) => {
    const messages = [];
    for (let i = 0; i < count; i++) {
      const message = await prisma.message.create({
        data: {
          tripId,
          senderId: testUserId,
          content: `Test message ${i + 1}`,
          messageType: 'TEXT',
          createdAt: new Date(Date.now() - (count - i) * 1000), // 1 second apart
        },
      });
      messages.push(message);
    }
    return messages;
  };

  describe('GET /api/trips/:tripId/messages - Pagination', () => {
    it('should return default 30 messages when no limit specified', async () => {
      // Create 50 messages
      await createTestMessages(50, 'trip-pagination-test');

      const response = await request(app)
        .get(`${API_BASE}/trips/trip-pagination-test/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(30);
      // Should return newest messages first (descending order)
      expect(response.body.data[0].content).toBe('Test message 50');
    });

    it('should respect custom limit parameter', async () => {
      await createTestMessages(50, 'trip-pagination-test');

      const response = await request(app)
        .get(`${API_BASE}/trips/trip-pagination-test/messages?limit=10`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(10);
    });

    it('should return messages before specified date (pagination)', async () => {
      await createTestMessages(50, 'trip-pagination-test');

      // Get the 30th message (index 29) to use as the "before" point
      const messagesResponse = await request(app)
        .get(`${API_BASE}/trips/trip-pagination-test/messages?limit=30`)
        .set('Authorization', `Bearer ${authToken}`);

      const oldestMessage = messagesResponse.body.data[messagesResponse.body.data.length - 1];
      const beforeDate = oldestMessage.createdAt;

      // Load older messages
      const olderResponse = await request(app)
        .get(`${API_BASE}/trips/trip-pagination-test/messages?limit=30&before=${beforeDate}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(olderResponse.status).toBe(200);
      expect(olderResponse.body.data.length).toBeGreaterThan(0);
      expect(olderResponse.body.data.length).toBeLessThanOrEqual(20); // Only 20 older messages exist
      // All returned messages should be older than the before date
      olderResponse.body.data.forEach((msg: any) => {
        expect(new Date(msg.createdAt).getTime()).toBeLessThan(new Date(beforeDate).getTime());
      });
    });

    it('should return empty array when no messages exist', async () => {
      const response = await request(app)
        .get(`${API_BASE}/trips/trip-pagination-test/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    it('should exclude deleted messages', async () => {
      const messages = await createTestMessages(5, 'trip-pagination-test');
      
      // Delete one message
      await prisma.message.update({
        where: { id: messages[4].id },
        data: { deletedAt: new Date() },
      });

      const response = await request(app)
        .get(`${API_BASE}/trips/trip-pagination-test/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(4);
      expect(response.body.data.some((m: any) => m.id === messages[4].id)).toBe(false);
    });

    it('should include sender information', async () => {
      await createTestMessages(5, 'trip-pagination-test');

      const response = await request(app)
        .get(`${API_BASE}/trips/trip-pagination-test/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0].sender).toBeDefined();
      expect(response.body.data[0].sender.id).toBe(testUserId);
      expect(response.body.data[0].sender.name).toBe('Test Pagination User');
    });
  });

  describe('POST /api/trips/:tripId/messages - Send Message', () => {
    it('should create a new message', async () => {
      const response = await request(app)
        .post(`${API_BASE}/trips/trip-pagination-test/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'New test message',
          messageType: 'TEXT',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.content).toBe('New test message');
      expect(response.body.data.senderId).toBe(testUserId);
    });

    it('should reject empty message content', async () => {
      const response = await request(app)
        .post(`${API_BASE}/trips/trip-pagination-test/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '',
        });

      expect(response.status).toBe(400);
    });

    it('should reject unauthorized user', async () => {
      // Create a trip without adding the user as a member
      await prisma.trip.create({
        data: {
          id: 'trip-no-access',
          name: 'No Access Trip',
          status: 'PLANNING',
          tripMasterId: 'user-2',
        },
      });

      const response = await request(app)
        .post(`${API_BASE}/trips/trip-no-access/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test message',
        });

      expect(response.status).toBe(403);

      // Cleanup
      await prisma.trip.delete({ where: { id: 'trip-no-access' } });
    });
  });

  describe('DELETE /api/messages/:id - Delete Message', () => {
    it('should soft delete a message', async () => {
      const messages = await createTestMessages(1, 'trip-pagination-test');
      const messageId = messages[0].id;

      const response = await request(app)
        .delete(`${API_BASE}/messages/${messageId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify message is soft deleted
      const deletedMessage = await prisma.message.findUnique({
        where: { id: messageId },
      });

      expect(deletedMessage?.deletedAt).toBeDefined();
      expect(deletedMessage?.content).toBe('[Message deleted]');
    });

    it('should reject deleting another user\'s message', async () => {
      // Create message as different user
      const otherMessage = await prisma.message.create({
        data: {
          tripId: 'trip-pagination-test',
          senderId: 'user-2',
          content: 'Other user message',
          messageType: 'TEXT',
        },
      });

      const response = await request(app)
        .delete(`${API_BASE}/messages/${otherMessage.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/messages/:id/reactions - Add/Remove Reaction', () => {
    it('should add a reaction to a message', async () => {
      const messages = await createTestMessages(1, 'trip-pagination-test');
      const messageId = messages[0].id;

      const response = await request(app)
        .post(`${API_BASE}/messages/${messageId}/reactions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          emoji: '👍',
          action: 'add',
        });

      expect(response.status).toBe(200);

      // Verify reaction was added
      const updatedMessage = await prisma.message.findUnique({
        where: { id: messageId },
      });

      expect(updatedMessage?.reactions).toBeDefined();
      const reactions = updatedMessage?.reactions as Record<string, string[]>;
      expect(reactions['👍']).toContain(testUserId);
    });

    it('should remove a reaction from a message', async () => {
      const messages = await createTestMessages(1, 'trip-pagination-test');
      const messageId = messages[0].id;

      // Add reaction first
      await prisma.message.update({
        where: { id: messageId },
        data: {
          reactions: { '👍': [testUserId] },
        },
      });

      const response = await request(app)
        .post(`${API_BASE}/messages/${messageId}/reactions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          emoji: '👍',
          action: 'remove',
        });

      expect(response.status).toBe(200);

      // Verify reaction was removed
      const updatedMessage = await prisma.message.findUnique({
        where: { id: messageId },
      });

      const reactions = updatedMessage?.reactions as Record<string, string[]> | null;
      expect(!reactions?.['👍'] || !reactions['👍'].includes(testUserId)).toBe(true);
    });
  });

  describe('POST /api/messages/:id/read - Mark as Read', () => {
    it('should mark a message as read', async () => {
      const messages = await createTestMessages(1, 'trip-pagination-test');
      const messageId = messages[0].id;

      const response = await request(app)
        .post(`${API_BASE}/messages/${messageId}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify read receipt was created
      const receipt = await prisma.messageReadReceipt.findUnique({
        where: {
          messageId_userId: {
            messageId,
            userId: testUserId,
          },
        },
      });

      expect(receipt).toBeDefined();
      expect(receipt?.readAt).toBeDefined();
    });
  });
});
