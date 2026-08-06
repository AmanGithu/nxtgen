import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Public site configuration — the admin-editable navigation menu and hero
// banners. Only active rows are exposed here; admins see everything via
// /api/admin/menu and /api/admin/banners.

router.get('/menu', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, items });
  } catch (error) {
    next(error);
  }
});

router.get('/banners', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banners = await prisma.heroBanner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, banners });
  } catch (error) {
    next(error);
  }
});

export default router;
