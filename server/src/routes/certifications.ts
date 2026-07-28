import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /api/certifications - List all active certifications with search & provider filter
router.get('/', async (req, res, next) => {
  try {
    const { search, provider, page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { provider: { contains: search as string } },
        { prerequisite: { contains: search as string } }
      ];
    }

    if (provider) {
      where.provider = { equals: provider as string };
    }

    const [total, certifications] = await Promise.all([
      prisma.certification.count({ where }),
      prisma.certification.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limitNum,
      })
    ]);

    res.json({
      success: true,
      certifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/certifications/inquire - Submit Contact Us CTA inquiry modal
const inquirySchema = z.object({
  certificationId: z.string().optional(),
  certificationName: z.string().min(1),
  userName: z.string().min(1),
  userEmail: z.string().email(),
  userPhone: z.string().optional(),
  message: z.string().optional(),
});

router.post('/inquire', async (req, res, next) => {
  try {
    const data = inquirySchema.parse(req.body);

    const inquiry = await prisma.certificationInquiry.create({
      data: {
        certificationId: data.certificationId || null,
        certificationName: data.certificationName,
        userName: data.userName,
        userEmail: data.userEmail,
        userPhone: data.userPhone || null,
        message: data.message || null,
        status: 'NEW',
      }
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully! Our team will get back to you shortly.',
      inquiry
    });
  } catch (error) {
    next(error);
  }
});

export default router;
