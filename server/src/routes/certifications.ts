import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /api/certifications/config - Public configuration for promotional banner & display
router.get('/config', async (_req, res, next) => {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: { key: { startsWith: 'CERT_' } }
    });

    const configMap: Record<string, string> = {
      CERT_BANNER_ACTIVE: 'true',
      CERT_BANNER_DISCOUNT_PERCENT: '40',
      CERT_BANNER_PROMO_CODE: 'CERT40',
      CERT_BANNER_TITLE: 'Mega Certification Sale! Save up to 40% on Official Exam Vouchers & Prep Packs',
      CERT_BANNER_SUBTITLE: 'Instant voucher activation & guaranteed pass guarantee. Limited time discount.',
      CERT_SHOW_PRICES: 'false',
    };

    configs.forEach(c => {
      configMap[c.key] = c.value;
    });

    res.json({
      success: true,
      config: configMap
    });
  } catch (error) {
    next(error);
  }
});

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
