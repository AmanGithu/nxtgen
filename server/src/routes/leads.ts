import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

/* ── Public endpoint to log a new lead from any CTA across the site ───── */
router.post('/public', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ctaType, sourceCategory, fullName, email, phone, metadata, notes } = z
      .object({
        ctaType: z.enum([
          'WHATSAPP',
          'FORM',
          'CALL',
          'EVENT',
          'AI_COORDINATOR',
          'COURSE',
          'INTERNSHIP',
          'CERTIFICATION',
          'TOOL',
          'JOB_SUPPORT',
          'CORPORATE',
        ]),
        sourceCategory: z.string().optional(),
        fullName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        metadata: z.record(z.any()).optional(),
        notes: z.string().optional(),
      })
      .parse(req.body);

    const lead = await prisma.lead.create({
      data: {
        ctaType,
        sourceCategory,
        fullName,
        email,
        phone,
        metadata: metadata || {},
        notes,
      },
    });

    res.status(201).json({ success: true, leadId: lead.id });
  } catch (error) {
    next(error);
  }
});

/* ── Protected endpoints for Lead Manager & Admin ─────────────────────── */
router.use(requireAuth, requireRole('ADMIN', 'LEAD_MANAGER'));

/** GET /api/leads — Filterable list of leads */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ctaType, status, search, startDate, endDate } = req.query;

    const where: any = {};

    if (ctaType && ctaType !== 'ALL') {
      where.ctaType = ctaType;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: String(search) } },
        { email: { contains: String(search) } },
        { phone: { contains: String(search) } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(String(startDate));
      if (endDate) where.createdAt.lte = new Date(String(endDate));
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Aggregate lead counts by ctaType for category menu counters
    const counts = await prisma.lead.groupBy({
      by: ['ctaType'],
      _count: { _all: true },
    });

    const countsMap: Record<string, number> = {};
    counts.forEach((c) => {
      countsMap[c.ctaType] = c._count._all;
    });

    res.json({ success: true, leads, countsMap });
  } catch (error) {
    next(error);
  }
});

/** PATCH /api/leads/:id/status — Update lead status and append notes */
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, notes } = z
      .object({
        status: z.enum(['NEW', 'CONTACTED', 'IN_PROGRESS', 'CLOSED']),
        notes: z.string().optional(),
      })
      .parse(req.body);

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        status,
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    res.json({ success: true, lead });
  } catch (error) {
    next(error);
  }
});

export default router;
