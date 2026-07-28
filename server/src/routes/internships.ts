import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/internships - List active internship programs
router.get('/', async (req, res, next) => {
  try {
    const internships = await prisma.internship.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, internships });
  } catch (error) {
    next(error);
  }
});

// POST /api/internships/apply - Apply for internship
const applySchema = z.object({
  internshipId: z.string().optional(),
  programTitle: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(5),
  resumeUrl: z.string().optional(),
});

router.post('/apply', async (req, res, next) => {
  try {
    const data = applySchema.parse(req.body);

    // Save as audit log or inquiry for admin review
    await prisma.auditLog.create({
      data: {
        action: 'INTERNSHIP_APPLICATION',
        targetModel: 'Internship',
        targetId: data.internshipId || 'general',
        payload: data as any,
        ipAddress: req.ip || null,
      }
    });

    res.status(201).json({
      success: true,
      message: 'Application received! Our academic admissions team will contact you within 24 hours.'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
