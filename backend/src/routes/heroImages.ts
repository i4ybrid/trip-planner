import { Router } from 'express';
import { authMiddleware, AuthRequest } from '@/middleware/auth';
import prisma from '@/lib/prisma';

const router = Router();

// GET /api/hero-images — list all (id, title, filename only)
router.get('/', async (_req, res) => {
  const images = await prisma.heroImage.findMany({
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
  const images = await prisma.heroImage.findMany({
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
router.post('/seed', authMiddleware, async (_req: AuthRequest, res) => {
  const fs = require('fs');
  const path = '/mnt/user/development/trip-planner/image_catalog.json';
  const catalog = JSON.parse(fs.readFileSync(path, 'utf-8'));
  const count = await prisma.heroImage.createMany({ data: catalog });
  return res.json({ count: count.count });
});

// GET /api/hero-images/:id — single image (must be LAST, catches everything)
router.get('/:id', async (req, res) => {
  const image = await prisma.heroImage.findUnique({ where: { id: req.params.id } });
  if (!image) return res.status(404).json({ error: 'Not found' });
  return res.json(image);
});

export default router;