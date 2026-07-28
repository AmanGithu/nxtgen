import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Protect ALL student routes
router.use(authenticate, authorize(UserRole.STUDENT, UserRole.ADMIN));

// ─── 1. Student Overview & Enrolled Courses ───
router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user!.id;

    // Find student enrollments
    const enrollments = await prisma.batchStudent.findMany({
      where: { studentId },
      include: {
        batch: {
          include: {
            course: true,
            schedules: {
              where: { dateTime: { gte: new Date() } },
              orderBy: { dateTime: 'asc' },
              take: 3,
            }
          }
        }
      }
    });

    const progress = await prisma.studentProgress.findMany({
      where: { userId: studentId }
    });

    const subscription = await prisma.subscription.findFirst({
      where: { userId: studentId, status: 'ACTIVE' }
    });

    const credits = await prisma.creditBalance.findUnique({
      where: { userId: studentId }
    });

    res.json({
      success: true,
      enrollments,
      progress,
      subscription: subscription || { plan: 'FREE', status: 'ACTIVE' },
      credits: credits || { totalCredits: 0, usedCredits: 0 },
      watermarkText: `Student: ${req.user!.email} | IP: ${req.ip || '103.42.11.4'} | ${new Date().toISOString().split('T')[0]}`
    });
  } catch (error) {
    next(error);
  }
});

// ─── 2. Study Materials (Date Descending, Dynamic Watermark metadata) ───
router.get('/materials', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user!.id;

    // Get all batch IDs the student is enrolled in
    const enrollments = await prisma.batchStudent.findMany({
      where: { studentId },
      select: { batchId: true }
    });

    const batchIds = enrollments.map(e => e.batchId);

    const materials = await prisma.studyMaterial.findMany({
      where: { batchId: { in: batchIds } },
      orderBy: { createdAt: 'desc' }, // Latest first
      include: { batch: { select: { name: true } } }
    });

    res.json({
      success: true,
      materials,
      watermark: {
        email: req.user!.email,
        ip: req.ip || '103.42.11.4',
        timestamp: new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    next(error);
  }
});

// ─── 3. Class Schedule ───
router.get('/schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user!.id;

    const enrollments = await prisma.batchStudent.findMany({
      where: { studentId },
      select: { batchId: true }
    });

    const batchIds = enrollments.map(e => e.batchId);

    const schedules = await prisma.classSchedule.findMany({
      where: { batchId: { in: batchIds } },
      orderBy: { dateTime: 'asc' },
      include: { batch: { select: { name: true } } }
    });

    res.json({ success: true, schedules });
  } catch (error) {
    next(error);
  }
});

export default router;
