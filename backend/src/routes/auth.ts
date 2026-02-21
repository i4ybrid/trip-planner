// Auth routes stub - requires next-auth to be configured
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Auth not configured - install next-auth and configure providers' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Auth not configured' });
});

export default router;
