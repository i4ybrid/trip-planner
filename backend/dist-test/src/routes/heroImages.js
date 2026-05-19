"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const prisma_1 = __importDefault(require("@/lib/prisma"));
const router = (0, express_1.Router)();
// GET /api/hero-images — list all (id, title, filename only)
router.get('/', async (_req, res) => {
    const images = await prisma_1.default.heroImage.findMany({
        select: { id: true, title: true, filename: true }
    });
    return res.json(images);
});
// GET /api/hero-images/search?q=<keyword> — search by synonym (case-insensitive)
router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Missing query param q' });
    }
    const keyword = q.toLowerCase();
    const images = await prisma_1.default.heroImage.findMany({
        where: {
            OR: [
                { title: { contains: keyword, mode: 'insensitive' } },
                { synonyms: { hasSome: [keyword] } }
            ]
        },
        select: { id: true, title: true, filename: true }
    });
    return res.json(images);
});
// POST /api/hero-images/seed — bulk seed from JSON
router.post('/seed', auth_1.authMiddleware, async (_req, res) => {
    const fs = require('fs');
    const path = '/mnt/user/development/trip-planner/image_catalog.json';
    const catalog = JSON.parse(fs.readFileSync(path, 'utf-8'));
    const count = await prisma_1.default.heroImage.createMany({ data: catalog });
    return res.json({ count: count.count });
});
// GET /api/hero-images/:id — single image (must be LAST, catches everything)
router.get('/:id', async (req, res) => {
    const image = await prisma_1.default.heroImage.findUnique({ where: { id: req.params.id } });
    if (!image)
        return res.status(404).json({ error: 'Not found' });
    return res.json(image);
});
exports.default = router;
//# sourceMappingURL=heroImages.js.map