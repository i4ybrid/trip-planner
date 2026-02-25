import { describe, it, expect, beforeEach } from 'vitest';
import { InviteService } from './invite.service';
import { createStubs } from '@/lib/stubs';

describe('InviteService', () => {
  let inviteService: InviteService;
  let stubs: ReturnType<typeof createStubs>;

  beforeEach(() => {
    stubs = createStubs();
    inviteService = new InviteService();
    (inviteService as any).prisma = stubs.prisma.getImplementation();
  });

  describe('createInvite', () => {
    it('should create an invite with a unique token', async () => {
      const inviteData = {
        tripId: 'trip-123',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        sentById: 'user-123',
      };

      const invite = await inviteService.createInvite(inviteData);

      expect(invite.token).toBeDefined();
      expect(invite.token.length).toBeGreaterThan(0);
      expect(invite.email).toBe('test@example.com');
      expect(invite.status).toBe('PENDING');
    });

    it('should include inviteUrl in response', async () => {
      const inviteData = {
        tripId: 'trip-123',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sentById: 'user-123',
      };

      const invite = await inviteService.createInvite(inviteData);

      expect(invite.inviteUrl).toBeDefined();
      expect(invite.inviteUrl).toContain(invite.token);
    });
  });

  describe('getInviteByToken', () => {
    it('should return invite for valid token', async () => {
      const prisma = stubs.prisma.getImplementation();
      
      // Create an invite first
      const created = await prisma.invite.create({
        data: {
          tripId: 'trip-123',
          token: 'test-token-123',
          email: 'test@example.com',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          sentById: 'user-123',
          status: 'PENDING',
        },
      });

      const invite = await inviteService.getInviteByToken('test-token-123');

      expect(invite).toBeDefined();
      expect(invite?.token).toBe('test-token-123');
    });

    it('should return null for invalid token', async () => {
      const invite = await inviteService.getInviteByToken('invalid-token');

      expect(invite).toBeNull();
    });
  });
});
