import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/corporate
router.get('/', async (req, res, next) => {
  try {
    const corporateCourses = await prisma.corporateCourse.findMany({
      where: { isActive: true },
      include: { course: true },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ success: true, corporateCourses });
  } catch (error) {
    next(error);
  }
});

// POST /api/corporate/inquire
const corporateInquirySchema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  workEmail: z.string().email(),
  phone: z.string().optional(),
  teamSize: z.string().optional(),
  message: z.string().optional(),
});

router.post('/inquire', async (req, res, next) => {
  try {
    const data = corporateInquirySchema.parse(req.body);

    await prisma.auditLog.create({
      data: {
        action: 'CORPORATE_INQUIRY',
        targetModel: 'CorporateCourse',
        payload: data as any,
        ipAddress: req.ip || null,
      }
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your enterprise inquiry. An executive learning advisor will get in touch shortly.'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
