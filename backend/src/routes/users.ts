import { Router } from 'express';
import { authMiddleware, AuthRequest, generateToken } from '@/middleware/auth';
import { upload } from '@/middleware/upload';
import { storageConfig } from '@/lib/storage';
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

// POST /api/users/oauth - Handle OAuth login/registration
router.post('/users/oauth', async (req, res) => {
  try {
    const { email, name, avatarUrl, provider, providerId } = req.body;

    if (!email || !provider) {
      res.status(400).json({ error: 'Email and provider are required' });
      return;
    }

    // Check if user exists with this email
    let user = await userService.getUserByEmail(email);

    if (user) {
      // User exists - update avatar if OAuth provided one and user doesn't have one
      if (avatarUrl && !user.avatarUrl) {
        user = await userService.updateUser(user.id, { avatarUrl });
      }
    } else {
      // Create new user
      user = await userService.createOAuthUser({
        email,
        name: name || email.split('@')[0],
        avatarUrl,
        provider,
        providerId,
      });
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

// POST /api/users/me/avatar - Upload avatar
router.post('/users/me/avatar', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    if (!req.file) {
      res.status(400).json({ error: 'File is required' });
      return;
    }

    // Process image with sharp: ensure square 400x400 crop and convert to JPEG
    const sharp = (await import('sharp')).default;
    
    // Get image metadata to check dimensions
    const metadata = await sharp(req.file.path).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    
    let processedImage;
    
    if (width < 400 || height < 400) {
      // Image is smaller than 400x400, just center crop to square without upscaling
      const size = Math.min(width, height);
      processedImage = await sharp(req.file.path)
        .extract({
          left: Math.floor((width - size) / 2),
          top: Math.floor((height - size) / 2),
          width: size,
          height: size,
        })
        .jpeg({ quality: 85 })
        .toBuffer();
    } else {
      // Image is large enough, resize to 400x400 with center crop
      processedImage = await sharp(req.file.path)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 85 })
        .toBuffer();
    }

    // Write processed image back to file system
    const fs = await import('fs');
    const path = await import('path');
    const processedPath = path.join(storageConfig.uploadDir, req.file.filename.replace(/\.[^/.]+$/, '.jpg'));
    fs.writeFileSync(processedPath, processedImage);

    // Remove original file
    if (req.file.path !== processedPath) {
      fs.unlinkSync(req.file.path);
    }

    // Get URL from storage config
    let avatarUrl = storageConfig.getFileUrl(path.basename(processedPath));

    // For local files, construct full URL
    if (!storageConfig.isRemote) {
      const protocol = req.protocol;
      const host = req.get('host') || process.env.BACKEND_URL || 'localhost:4000';
      avatarUrl = `${protocol}://${host}${avatarUrl}`;
    }

    // Update user with new avatar URL
    const user = await userService.updateUser(userId, { avatarUrl });

    res.json({ data: { avatarUrl: user.avatarUrl } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/me/avatar - Remove avatar
router.delete('/users/me/avatar', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    // Get current user to get avatar URL
    const user = await userService.getUserById(userId);
    if (user?.avatarUrl) {
      // Delete the file from storage
      await storageConfig.deleteFile(user.avatarUrl);
    }

    // Update user with null avatar
    await userService.updateUser(userId, { avatarUrl: undefined });

    res.json({ message: 'Avatar removed successfully' });
  } catch (error: any) {
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
