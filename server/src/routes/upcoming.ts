import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * Public "upcoming batches" listing.
 *
 * Derived from real Batch records rather than a separate marketing table, so a
 * cohort is entered once and its dates can't drift between what operations
 * runs and what the public site advertises. A batch appears here only once an
 * admin publishes it.
 */
router.get('/', async (req, res, next) => {
  try {
    const batches = await prisma.batch.findMany({
      where: {
        isPublished: true,
        status: { in: ['DRAFT', 'ACTIVE'] },
      },
      orderBy: { startDate: 'asc' },
      include: {
        course: { select: { title: true, slug: true, shortDesc: true, category: true } },
        _count: { select: { students: true } },
      },
    });

    res.json({
      success: true,
      upcomingBatches: batches.map((b) => ({
        id: b.id,
        name: b.name,
        courseName: b.course?.title ?? '',
        courseSlug: b.course?.slug ?? '',
        description: b.course?.shortDesc ?? '',
        category: b.course?.category ?? null,
        startDate: b.startDate,
        webinarDate: b.webinarDate,
        seatsRemaining: Math.max(0, b.maxStudents - b._count.students),
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
