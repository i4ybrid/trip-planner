import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InviteService } from './invite.service';

interface MockPrisma {
  invite: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  inviteChannel: {
    create: ReturnType<typeof vi.fn>;
  };
  tripMember: {
    create: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
}

const mockPrisma: MockPrisma = {
  invite: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  inviteChannel: {
    create: vi.fn(),
  },
  tripMember: {
    create: vi.fn(),
  },
  $transaction: vi.fn((cb: (prisma: MockPrisma) => unknown) => cb(mockPrisma)),
};

const mockPrismaClient = mockPrisma as any;

describe('InviteService', () => {
  let inviteService: InviteService;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    inviteService = new InviteService(mockPrismaClient);
  });

  describe('createInvite', () => {
    it('should create an invite with token', async () => {
      mockPrisma.invite.create.mockResolvedValue({
        id: 'invite-1',
        tripId: 'trip-1',
        token: 'testtoken123',
        email: 'test@example.com',
        status: 'PENDING',
        expiresAt: new Date(),
        sentById: 'user-1',
      });

      const result = await inviteService.createInvite({
        tripId: 'trip-1',
        email: 'test@example.com',
        sentById: 'user-1',
      });

      expect(result.tripId).toBe('trip-1');
      expect(result.token).toBeDefined();
      expect(mockPrisma.invite.create).toHaveBeenCalled();
    });
  });

  describe('acceptInvite', () => {
    it('should accept invite and create member', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue({
        id: 'invite-1',
        tripId: 'trip-1',
        token: 'validtoken',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
      });

      mockPrisma.invite.update.mockResolvedValue({});
      mockPrisma.tripMember.create.mockResolvedValue({});
      mockPrisma.inviteChannel.create.mockResolvedValue({});

      await expect(
        inviteService.acceptInvite('validtoken', 'user-2')
      ).resolves.not.toThrow();
    });

    it('should throw for expired invite', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue({
        id: 'invite-1',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 86400000),
      });

      await expect(
        inviteService.acceptInvite('expiredtoken', 'user-2')
      ).rejects.toThrow('Invite has expired');
    });

    it('should throw for already processed invite', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue({
        id: 'invite-1',
        status: 'ACCEPTED',
        expiresAt: new Date(Date.now() + 86400000),
      });

      await expect(
        inviteService.acceptInvite('usedtoken', 'user-2')
      ).rejects.toThrow('Invite already processed');
    });
  });

  describe('isInviteValid', () => {
    it('should return true for valid invite', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue({
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
      });

      const result = await inviteService.isInviteValid('validtoken');
      expect(result).toBe(true);
    });

    it('should return false for expired invite', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue({
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 86400000),
      });

      const result = await inviteService.isInviteValid('expiredtoken');
      expect(result).toBe(false);
    });

    it('should return false for non-pending invite', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue({
        status: 'ACCEPTED',
        expiresAt: new Date(Date.now() + 86400000),
      });

      const result = await inviteService.isInviteValid('usedtoken');
      expect(result).toBe(false);
    });

    it('should return false for non-existent invite', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue(null);

      const result = await inviteService.isInviteValid('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('revokeInvite', () => {
    it('should revoke invite', async () => {
      mockPrisma.invite.update.mockResolvedValue({} as any);

      await inviteService.revokeInvite('invite-1');

      expect(mockPrisma.invite.update).toHaveBeenCalledWith({
        where: { id: 'invite-1' },
        data: { status: 'REVOKED' },
      });
    });
  });
});
