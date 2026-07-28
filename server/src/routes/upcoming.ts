import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/upcoming-batches
router.get('/', async (req, res, next) => {
  try {
    const batches = await prisma.upcomingBatch.findMany({
      where: { isPublished: true },
      orderBy: { startDate: 'asc' },
    });

    res.json({ success: true, upcomingBatches: batches });
  } catch (error) {
    next(error);
  }
});

export default router;
