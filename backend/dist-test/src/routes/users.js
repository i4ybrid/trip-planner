"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const upload_1 = require("@/middleware/upload");
const storage_1 = require("@/lib/storage");
const user_service_1 = require("@/services/user.service");
const validations_1 = require("@/lib/validations");
const router = (0, express_1.Router)();
const US_STATE_CODES = {
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
function getCityFromAddress(address) {
    return (address.city ||
        address.town ||
        address.village ||
        address.hamlet ||
        address.municipality ||
        address.suburb ||
        address.borough ||
        address.county ||
        '');
}
function getStateFromAddress(address) {
    if (!address.state)
        return '';
    if (address.country_code?.toUpperCase() !== 'US')
        return address.state;
    return US_STATE_CODES[address.state] || address.state;
}
// POST /api/auth/register - Register new user
router.post('/auth/register', async (req, res) => {
    try {
        const validatedData = validations_1.createUserSchema.parse(req.body);
        // Check if user already exists
        const existingUser = await user_service_1.userService.getUserByEmail(validatedData.email);
        if (existingUser) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }
        const user = await user_service_1.userService.createUser(validatedData);
        const token = (0, auth_1.generateToken)({ userId: user.id, email: user.email });
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
    }
    catch (error) {
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
        let user = await user_service_1.userService.getUserByEmail(email);
        if (user) {
            // User exists - update avatar if OAuth provided one and user doesn't have one
            if (avatarUrl && !user.avatarUrl) {
                user = await user_service_1.userService.updateUser(user.id, { avatarUrl });
            }
        }
        else {
            // Create new user
            user = await user_service_1.userService.createOAuthUser({
                email,
                name: name || email.split('@')[0],
                avatarUrl,
                provider,
                providerId,
            });
        }
        const token = (0, auth_1.generateToken)({ userId: user.id, email: user.email });
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
    }
    catch (error) {
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
        const user = await user_service_1.userService.verifyPassword(email, password);
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const token = (0, auth_1.generateToken)({ userId: user.id, email: user.email });
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
    }
    catch (error) {
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
        const result = await user_service_1.userService.generatePasswordResetToken(email);
        const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetLink = `${appUrl}/reset-password?token=${result.token}`;
        // For now, return the link directly (email not enabled)
        res.json({
            message: 'If an account exists, a reset link has been sent.',
            resetLink, // temp: return link directly
        });
    }
    catch (error) {
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
        const success = await user_service_1.userService.resetPassword(token, newPassword);
        if (!success) {
            res.status(400).json({ error: 'Token is invalid or expired' });
            return;
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/locations/reverse - Resolve coordinates to profile location labels
router.get('/locations/reverse', auth_1.authMiddleware, async (req, res) => {
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
        const data = await response.json();
        const address = data.address || {};
        res.json({
            data: {
                city: getCityFromAddress(address),
                state: getStateFromAddress(address),
                country: address.country_code?.toUpperCase() || '',
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/users/me - Get current user profile
router.get('/users/me', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await user_service_1.userService.getUserById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ data: user });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PATCH /api/users/me - Update profile
router.patch('/users/me', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const validatedData = validations_1.updateUserSchema.parse(req.body);
        const user = await user_service_1.userService.updateUser(userId, validatedData);
        res.json({ data: user });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
// POST /api/users/me/avatar - Upload avatar
router.post('/users/me/avatar', auth_1.authMiddleware, upload_1.upload.single('file'), async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!req.file) {
            res.status(400).json({ error: 'File is required' });
            return;
        }
        // Process image with sharp: ensure square 400x400 crop and convert to JPEG
        const sharp = (await Promise.resolve().then(() => __importStar(require('sharp')))).default;
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
        }
        else {
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
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const processedPath = path.join(storage_1.storageConfig.uploadDir, req.file.filename.replace(/\.[^/.]+$/, '.jpg'));
        fs.writeFileSync(processedPath, processedImage);
        // Remove original file
        if (req.file.path !== processedPath) {
            fs.unlinkSync(req.file.path);
        }
        // Get URL from storage config
        let avatarUrl = storage_1.storageConfig.getFileUrl(path.basename(processedPath));
        // For local files, construct full URL
        if (!storage_1.storageConfig.isRemote) {
            const protocol = req.protocol;
            const host = req.get('host') || process.env.BACKEND_URL || 'localhost:4000';
            avatarUrl = `${protocol}://${host}${avatarUrl}`;
        }
        // Update user with new avatar URL
        const user = await user_service_1.userService.updateUser(userId, { avatarUrl });
        res.json({ data: { avatarUrl: user.avatarUrl } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/users/me/avatar - Remove avatar
router.delete('/users/me/avatar', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        // Get current user to get avatar URL
        const user = await user_service_1.userService.getUserById(userId);
        if (user?.avatarUrl) {
            // Delete the file from storage
            await storage_1.storageConfig.deleteFile(user.avatarUrl);
        }
        // Update user with null avatar
        await user_service_1.userService.updateUser(userId, { avatarUrl: undefined });
        res.json({ message: 'Avatar removed successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/users/me/password - Change password
router.post('/users/me/password', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({ error: 'Current and new password are required' });
            return;
        }
        await user_service_1.userService.updatePassword(userId, currentPassword, newPassword);
        res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// GET /api/users/:id - Get user by ID (public info)
router.get('/users/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await user_service_1.userService.getUserById(req.params.id);
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/settings - Get user settings
router.get('/settings', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const settings = await user_service_1.userService.getSettings(userId);
        res.json({ data: settings });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PATCH /api/settings - Update settings
router.patch('/settings', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const validatedData = validations_1.updateSettingsSchema.parse(req.body);
        const settings = await user_service_1.userService.updateSettings(userId, validatedData);
        res.json({ data: settings });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map