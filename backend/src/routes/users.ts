import { Router } from 'express';
import { UserService } from '../services/user.service';
import { PrismaClient } from '@prisma/client';
import { validate, asyncHandler } from '../middleware/error-handler';
import { updateUserSchema } from '../lib/validation-schemas';

const router = Router();
const prisma = new PrismaClient();
const userService = new UserService(prisma);

// Get current user profile
router.get('/me', asyncHandler(async (req, res) => {
  // In real app, get userId from session
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await userService.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
}));

// Update current user profile
router.patch('/me', validate(updateUserSchema), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await userService.updateUser(userId, req.body);
  res.json(user);
}));

// Get user by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
}));

// Search users
router.get('/', asyncHandler(async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: 'Search query required' });
  }

  const users = await userService.searchUsers(query);
  res.json(users);
}));

// Get user's friends
router.get('/:id/friends', asyncHandler(async (req, res) => {
  const friends = await userService.getFriends(req.params.id);
  res.json(friends);
}));

// Get users by IDs
router.post('/batch', asyncHandler(async (req, res) => {
  const { userIds } = req.body;
  if (!Array.isArray(userIds)) {
    return res.status(400).json({ error: 'userIds array required' });
  }

  const users = await userService.getUsersByIds(userIds);
  res.json(users);
}));

export default router;

