import { Router } from 'express';
import { authMiddleware, AuthRequest, generateToken } from '@/middleware/auth';
import { upload } from '@/middleware/upload';
import { storageConfig } from '@/lib/storage';
import { userService } from '@/services/user.service';
import { createUserSchema, updateUserSchema, updateSettingsSchema } from '@/lib/validations';

const router = Router();

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  suburb?: string;
  borough?: string;
  county?: string;
  state?: string;
  country?: string;
  country_code?: string;
}

interface NominatimReverseResponse {
  address?: NominatimAddress;
}

const US_STATE_CODES: Record<string, string> = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
  'District of Columbia': 'DC',
};

function getCityFromAddress(address: NominatimAddress): string {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.municipality ||
    address.suburb ||
    address.borough ||
    address.county ||
    ''
  );
}

function getStateFromAddress(address: NominatimAddress): string {
  if (!address.state) return '';
  if (address.country_code?.toUpperCase() !== 'US') return address.state;
  return US_STATE_CODES[address.state] || address.state;
}

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

// POST /api/auth/forgot-password
router.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const result = await userService.generatePasswordResetToken(email);
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${result.token}`;
    // For now, return the link directly (email not enabled)
    res.json({ 
      message: 'If an account exists, a reset link has been sent.',
      resetLink, // temp: return link directly
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/reset-password
router.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }
    const success = await userService.resetPassword(token, newPassword);
    if (!success) {
      res.status(400).json({ error: 'Token is invalid or expired' });
      return;
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/locations/reverse - Resolve coordinates to profile location labels
router.get('/locations/reverse', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      res.status(400).json({ error: 'Latitude and longitude are required.' });
      return;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      res.status(400).json({ error: 'Coordinates are out of range.' });
      return;
    }

    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('zoom', '10');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en',
        'User-Agent': 'TripPlanner/1.0 (local development)',
      },
    });

    if (!response.ok) {
      res.status(502).json({ error: 'Could not resolve browser location.' });
      return;
    }

    const data = await response.json() as NominatimReverseResponse;
    const address = data.address || {};

    res.json({
      data: {
        city: getCityFromAddress(address),
        state: getStateFromAddress(address),
        country: address.country_code?.toUpperCase() || '',
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
