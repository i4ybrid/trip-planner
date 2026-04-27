import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '@/middleware/auth';
import { searchAll } from '@/services/search.service';

const router = Router();

const querySchema = z.object({
  /** Search query string */
  q: z.string().min(1).max(500),
  /** Optional: restrict to a specific entity type */
  type: z.enum(['trip', 'activity', 'expense']).optional(),
  /** Max results to return (default 20, max 100) */
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/search?q=...&type=...&limit=...
router.get('/search', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid query parameters',
      details: parsed.error.flatten(),
    });
    return;
  }

  const { q, type, limit } = parsed.data;

  try {
    const results = await searchAll(userId, q, { limit, type });
    res.json(results);
  } catch (err: any) {
    console.error('[/api/search] Error:', err);
    res.status(500).json({ error: 'Search failed', message: err.message });
  }
});

export default router;
