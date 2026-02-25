import { Router } from 'express';
import { authMiddleware, AuthRequest, generateToken } from '@/middleware/auth';
import { userService } from '@/services/user.service';
import { createUserSchema, updateUserSchema, updateSettingsSchema } from '@/lib/validations';

const router = Router();

// POST /api/auth/register - Register new user
router.post('/auth/register', async (req, res) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await userService.getUserByEmail(validatedData.email);
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }
    
    const user = await userService.createUser(validatedData);
    const token = generateToken({ userId: user.id, email: user.email });
    
    res.status(201).json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        token,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login - Login user
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await userService.verifyPassword(email, password);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/me - Get current user profile
router.get('/users/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = await userService.getUserById(userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json({ data: user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/users/me - Update profile
router.patch('/users/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const validatedData = updateUserSchema.parse(req.body);
    
    const user = await userService.updateUser(userId, validatedData);
    res.json({ data: user });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users/me/password - Change password
router.post('/users/me/password', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password are required' });
      return;
    }
    
    await userService.updatePassword(userId, currentPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/users/:id - Get user by ID (public info)
router.get('/users/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // Return only public info
    res.json({
      data: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/settings - Get user settings
router.get('/settings', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const settings = await userService.getSettings(userId);
    
    res.json({ data: settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/settings - Update settings
router.patch('/settings', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const validatedData = updateSettingsSchema.parse(req.body);
    
    const settings = await userService.updateSettings(userId, validatedData);
    res.json({ data: settings });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
