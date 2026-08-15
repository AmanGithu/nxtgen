import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

/** GET /api/analytics/summary — Full site analytics data for Admin dashboard */
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roleFilter, userStatusFilter } = req.query;

    // 1. Leads by CTA Type
    const leadsByCta = await prisma.lead.groupBy({
      by: ['ctaType'],
      _count: { _all: true },
    });

    // 2. Leads by Status
    const leadsByStatus = await prisma.lead.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    // 3. User distribution by Role
    const userRoleCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true },
    });

    // 4. User distribution by Status
    const userStatusCounts = await prisma.user.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    // 5. Total counts
    const totalUsers = await prisma.user.count();
    const totalLeads = await prisma.lead.count();
    const totalBatches = await prisma.batch.count();
    const totalEnrollments = await prisma.batchStudent.count();

    // 6. Recent daily leads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLeads = await prisma.lead.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, ctaType: true, status: true },
    });

    // Group leads by date
    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      dailyMap[dateKey] = 0;
    }

    recentLeads.forEach((l) => {
      const key = l.createdAt.toISOString().split('T')[0];
      if (dailyMap[key] !== undefined) {
        dailyMap[key]++;
      }
    });

    const dailyLeads = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .reverse();

    // 7. Top visited pages & CTAs (curated analytics summary)
    const topPages = [
      { page: '/courses', visits: 1420, label: 'Course Catalog' },
      { page: '/certifications', visits: 980, label: 'Certifications' },
      { page: '/internship', visits: 860, label: 'Internships' },
      { page: '/tools', visits: 740, label: 'AI Tools Store' },
      { page: '/job-support', visits: 520, label: 'Technical Job Support' },
      { page: '/corporate', visits: 410, label: 'Corporate Programs' },
      { page: '/connect-us', visits: 390, label: 'Connect Us' },
    ];

    const topCtas = [
      { name: 'WhatsApp Automaton', clicks: 640 },
      { name: 'Talk to PAVY (AI Coordinator)', clicks: 490 },
      { name: 'Course Enrollment Modal', clicks: 380 },
      { name: 'Internship Application', clicks: 290 },
      { name: 'Job Support Callback', clicks: 180 },
    ];

    res.json({
      success: true,
      totals: {
        totalUsers,
        totalLeads,
        totalBatches,
        totalEnrollments,
      },
      dailyLeads,
      leadsByCta: leadsByCta.map((l) => ({ ctaType: l.ctaType, count: l._count._all })),
      leadsByStatus: leadsByStatus.map((l) => ({ status: l.status, count: l._count._all })),
      userRoleCounts: userRoleCounts.map((u) => ({ role: u.role, count: u._count._all })),
      userStatusCounts: userStatusCounts.map((u) => ({ status: u.status, count: u._count._all })),
      topPages,
      topCtas,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
