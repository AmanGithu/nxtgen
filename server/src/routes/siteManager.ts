import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Protect all site manager endpoints
router.use(requireAuth, requireRole('ADMIN', 'SITE_MANAGER'));

/** GET /api/site-manager/content — List all site content pages & sections */
router.get('/content', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const contents = await prisma.siteContent.findMany({
      orderBy: [{ pageSlug: 'asc' }, { sectionKey: 'asc' }],
    });
    res.json({ success: true, contents });
  } catch (error) {
    next(error);
  }
});

/** PUT /api/site-manager/content — Save / publish page section content */
router.put('/content', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pageSlug, sectionKey, title, contentJson, seoTitle, seoDescription, seoKeywords, isPublished } = z
      .object({
        pageSlug: z.string().min(1),
        sectionKey: z.string().min(1),
        title: z.string().optional(),
        contentJson: z.record(z.any()).optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        seoKeywords: z.string().optional(),
        isPublished: z.boolean().optional(),
      })
      .parse(req.body);

    const existing = await prisma.siteContent.findUnique({
      where: { pageSlug_sectionKey: { pageSlug, sectionKey } },
    });

    const content = await prisma.siteContent.upsert({
      where: { pageSlug_sectionKey: { pageSlug, sectionKey } },
      create: {
        pageSlug,
        sectionKey,
        title,
        contentJson: contentJson || {},
        seoTitle,
        seoDescription,
        seoKeywords,
        isPublished: isPublished ?? true,
        version: 1,
      },
      update: {
        title,
        contentJson: contentJson || {},
        seoTitle,
        seoDescription,
        seoKeywords,
        isPublished: isPublished ?? true,
        version: (existing?.version || 1) + 1,
      },
    });

    res.json({ success: true, content });
  } catch (error) {
    next(error);
  }
});

export default router;
