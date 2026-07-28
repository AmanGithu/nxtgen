import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /api/courses - List all active courses grouped by category
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    
    const where: any = { isActive: true };
    if (category && (category === 'AI' || category === 'DATABASE')) {
      where.category = category;
    }

    const courses = await prisma.course.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ success: true, courses });
  } catch (error) {
    next(error);
  }
});

// GET /api/courses/:slug - Get single course details by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        batches: {
          where: { status: 'ACTIVE' },
          select: { id: true, name: true, startDate: true, endDate: true, maxStudents: true }
        },
        certifications: {
          include: { certification: true }
        }
      }
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    res.json({ success: true, course });
  } catch (error) {
    next(error);
  }
});

export default router;
