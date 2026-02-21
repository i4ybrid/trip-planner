import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UserService } from './user.service';

const mockPrisma = {
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  tripMember: {
    findMany: vi.fn(),
  },
};

const mockPrismaClient = mockPrisma as any;

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    vi.resetAllMocks();
    userService = new UserService(mockPrismaClient);
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        ...userData,
        phone: null,
        venmo: null,
        paypal: null,
        zelle: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await userService.createUser(userData);

      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
        }),
      });
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const user = { id: 'user-1', email: 'test@example.com', name: 'Test' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await userService.getUserById('user-1');

      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const user = { id: 'user-1', email: 'test@example.com', name: 'Test' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await userService.getUserByEmail('test@example.com');

      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      const updateData = { name: 'Updated Name', venmo: '@testuser' };
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        ...updateData,
      } as any);

      const result = await userService.updateUser('user-1', updateData);

      expect(result.name).toBe('Updated Name');
      expect(result.venmo).toBe('@testuser');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: updateData,
      });
    });
  });

  describe('searchUsers', () => {
    it('should search users by name or email', async () => {
      const users = [
        { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
      ];
      mockPrisma.user.findMany.mockResolvedValue(users);

      const result = await userService.searchUsers('john');

      expect(result).toHaveLength(1);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'john', mode: 'insensitive' } },
            { email: { contains: 'john', mode: 'insensitive' } },
          ],
        },
        take: 20,
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      mockPrisma.user.delete.mockResolvedValue({} as any);

      await userService.deleteUser('user-1');

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });
  });

  describe('getUsersByIds', () => {
    it('should return users by ids', async () => {
      const users = [
        { id: 'user-1', name: 'User 1' },
        { id: 'user-2', name: 'User 2' },
      ];
      mockPrisma.user.findMany.mockResolvedValue(users);

      const result = await userService.getUsersByIds(['user-1', 'user-2']);

      expect(result).toHaveLength(2);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['user-1', 'user-2'] } },
      });
    });

    it('should return empty array for empty ids', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await userService.getUsersByIds([]);

      expect(result).toHaveLength(0);
    });
  });

  describe('getFriends', () => {
    it('should return friends from shared trips', async () => {
      mockPrisma.tripMember.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          trip: {
            members: [
              { userId: 'user-2', user: { id: 'user-2', name: 'Friend 1' } },
              { userId: 'user-3', user: { id: 'user-3', name: 'Friend 2' } },
            ],
          },
        },
      ]);

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-2', name: 'Friend 1' },
        { id: 'user-3', name: 'Friend 2' },
      ]);

      const result = await userService.getFriends('user-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['user-2', 'user-3'] } },
      });
    });

    it('should return empty array when no trips', async () => {
      mockPrisma.tripMember.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await userService.getFriends('user-1');

      expect(result).toHaveLength(0);
    });

    it('should not include self as friend', async () => {
      mockPrisma.tripMember.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          trip: {
            members: [
              { userId: 'user-1', user: { id: 'user-1', name: 'Me' } },
              { userId: 'user-2', user: { id: 'user-2', name: 'Friend' } },
            ],
          },
        },
      ]);

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-2', name: 'Friend' },
      ]);

      const result = await userService.getFriends('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user-2');
    });
  });
});
