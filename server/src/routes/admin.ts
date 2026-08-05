import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { sendPasswordSetEmail } from '../services/emailService';

const router = Router();

// Protect ALL admin routes with authenticate + authorize(UserRole.ADMIN)
router.use(authenticate, authorize(UserRole.ADMIN));

// ─── 1. Overview KPIs ───
router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalUsers, totalStudents, totalBatches, totalCertInquiries, recentLogs] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: UserRole.STUDENT } }),
      prisma.batch.count({ where: { status: 'ACTIVE' } }),
      prisma.certificationInquiry.count({ where: { status: 'NEW' } }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { email: true, firstName: true } } }
      })
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalBatches,
        newCertInquiries: totalCertInquiries,
      },
      recentLogs
    });
  } catch (error) {
    next(error);
  }
});

// ─── 2. User Management ───
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, search, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;

    const where: any = {};
    if (role && typeof role === 'string') where.role = role as UserRole;
    if (search) {
      where.OR = [
        { email: { contains: search as string } },
        { firstName: { contains: search as string } },
        { lastName: { contains: search as string } }
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          mustChangePassword: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      })
    ]);

    res.json({
      success: true,
      users,
      pagination: { total, page: pageNum, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    next(error);
  }
});

// Invite user (send Resend set-password link)
router.post('/users/invite', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, firstName, lastName, role } = z.object({
      email: z.string().email(),
      firstName: z.string().min(1),
      lastName: z.string().optional(),
      role: z.enum(['ADMIN', 'STUDENT', 'SITE_USER']),
    }).parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('User with this email already exists', 400);

    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName: lastName || '',
        role: role as UserRole,
        mustChangePassword: true,
      }
    });

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.userInviteToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }
    });

    await sendPasswordSetEmail(email, token, firstName);

    res.status(201).json({
      success: true,
      message: `Invitation email sent to ${email} with set-password token`,
      user
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/role', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = z.object({ role: z.enum(['ADMIN', 'STUDENT', 'SITE_USER']) }).parse(req.body);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await prisma.user.update({
      where: { id },
      data: { role: role as UserRole }
    });
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// ─── 3. Batch Configuration ───
router.get('/batches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        course: { select: { title: true } },
        _count: { select: { students: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, batches });
  } catch (error) {
    next(error);
  }
});

router.post('/batches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      name: z.string().min(1),
      courseId: z.string().min(1),
      startDate: z.string(),
      endDate: z.string(), // Max student access duration
      maxStudents: z.number().optional().default(30),
      driveFolder: z.string().optional(),
      status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional().default('ACTIVE'),
    }).parse(req.body);

    const batch = await prisma.batch.create({
      data: {
        name: data.name,
        courseId: data.courseId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        maxStudents: data.maxStudents,
        driveFolder: data.driveFolder || null,
        status: data.status,
      }
    });

    res.status(201).json({ success: true, batch });
  } catch (error) {
    next(error);
  }
});

// ─── 4. Class Scheduler ───
router.get('/scheduler', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedules = await prisma.classSchedule.findMany({
      include: { batch: { select: { name: true } } },
      orderBy: { dateTime: 'asc' }
    });
    res.json({ success: true, schedules });
  } catch (error) {
    next(error);
  }
});

router.post('/scheduler', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      batchId: z.string().min(1),
      title: z.string().min(1),
      dateTime: z.string(),
      zoomLink: z.string().optional(),
      duration: z.number().optional().default(60),
    }).parse(req.body);

    const schedule = await prisma.classSchedule.create({
      data: {
        batchId: data.batchId,
        title: data.title,
        dateTime: new Date(data.dateTime),
        zoomLink: data.zoomLink || null,
        duration: data.duration,
      }
    });

    res.status(201).json({ success: true, schedule });
  } catch (error) {
    next(error);
  }
});

// ─── 5. Upcoming Batches CRUD ───
router.get('/upcoming', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batches = await prisma.upcomingBatch.findMany({ orderBy: { startDate: 'asc' } });
    res.json({ success: true, upcomingBatches: batches });
  } catch (error) {
    next(error);
  }
});

router.post('/upcoming', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      courseName: z.string().min(1),
      startDate: z.string(),
      webinarDate: z.string().optional(),
      description: z.string().optional(),
      isPublished: z.boolean().optional().default(true),
    }).parse(req.body);

    const batch = await prisma.upcomingBatch.create({
      data: {
        courseName: data.courseName,
        startDate: new Date(data.startDate),
        webinarDate: data.webinarDate ? new Date(data.webinarDate) : null,
        description: data.description || null,
        isPublished: data.isPublished,
      }
    });

    res.status(201).json({ success: true, batch });
  } catch (error) {
    next(error);
  }
});

// ─── 8. Study Materials (Sorted Date Descending) ───
router.get('/materials', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { batchId } = req.query;
    const where: any = {};
    if (batchId && typeof batchId === 'string') where.batchId = batchId;

    const materials = await prisma.studyMaterial.findMany({
      where,
      orderBy: { createdAt: 'desc' }, // Latest first
      include: { batch: { select: { name: true } } }
    });

    res.json({ success: true, materials });
  } catch (error) {
    next(error);
  }
});

router.post('/materials', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      batchId: z.string().min(1),
      type: z.enum(['NOTES', 'RECORDING', 'ASSIGNMENT', 'QUIZ']),
      title: z.string().min(1),
      driveFileId: z.string().optional(),
      driveUrl: z.string().optional(),
      description: z.string().optional(),
    }).parse(req.body);

    const material = await prisma.studyMaterial.create({
      data: {
        batchId: data.batchId,
        type: data.type,
        title: data.title,
        driveFileId: data.driveFileId || null,
        driveUrl: data.driveUrl || null,
        description: data.description || null,
      }
    });

    res.status(201).json({ success: true, material });
  } catch (error) {
    next(error);
  }
});

// ─── 9. Certifications CRUD ───
router.post('/certifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      name: z.string().min(1),
      provider: z.string().optional(),
      link: z.string().optional(),
      prerequisite: z.string().optional(),
    }).parse(req.body);

    const cert = await prisma.certification.create({ data });
    res.status(201).json({ success: true, cert });
  } catch (error) {
    next(error);
  }
});

router.delete('/certifications/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.certification.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ success: true, message: 'Certification soft deleted' });
  } catch (error) {
    next(error);
  }
});

// ─── 10. Cert Inquiries Admin View ───
router.get('/cert-inquiries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inquiries = await prisma.certificationInquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, inquiries });
  } catch (error) {
    next(error);
  }
});

router.patch('/cert-inquiries/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = z.object({ status: z.enum(['NEW', 'CONTACTED', 'CLOSED']) }).parse(req.body);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const inquiry = await prisma.certificationInquiry.update({
      where: { id },
      data: { status }
    });
    res.json({ success: true, inquiry });
  } catch (error) {
    next(error);
  }
});

// ─── 14. AI Configuration ───
router.get('/ai-config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: { key: { startsWith: 'GEMINI_' } }
    });

    const configMap: Record<string, string> = {
      GEMINI_PRIMARY_MODEL: 'gemini-1.5-flash',
      GEMINI_FALLBACK_MODEL: 'gemini-1.5-pro',
      GEMINI_VOICE_MODEL: 'gemini-2.0-flash-exp',
    };

    configs.forEach(c => { configMap[c.key] = c.value; });

    res.json({ success: true, config: configMap });
  } catch (error) {
    next(error);
  }
});

router.post('/ai-config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        await prisma.siteConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        });
      }
    }
    res.json({ success: true, message: 'AI configuration updated successfully' });
  } catch (error) {
    next(error);
  }
});

// ─── 15. I-Assist Configuration ───
router.get('/iassist-config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: { key: { startsWith: 'IASSIST_' } }
    });

    const configMap: Record<string, string> = {
      IASSIST_TRANSCRIPTION_MODEL: 'gemini-2.0-flash',
      IASSIST_QUERY_MODEL: 'gemini-2.5-flash',
      IASSIST_MAX_HISTORY: '40',
      IASSIST_MAX_TOKENS: '8192',
      IASSIST_VAD_SILENCE_MS: '1500',
      IASSIST_VAD_AMPLITUDE_THRESHOLD: '0.015',
      IASSIST_VAD_MIN_SPEECH_MS: '500',
    };

    configs.forEach(c => { configMap[c.key] = c.value; });

    res.json({ success: true, config: configMap });
  } catch (error) {
    next(error);
  }
});

router.post('/iassist-config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && key.startsWith('IASSIST_')) {
        await prisma.siteConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        });
      }
    }
    res.json({ success: true, message: 'I-Assist configuration updated successfully' });
  } catch (error) {
    next(error);
  }
});

// ─── 15.5. Live AI Agent Configuration ───
router.get('/agent-config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: { key: { startsWith: 'AGENT_' } }
    });

    const configMap: Record<string, string> = {
      ACTIVE_AVATAR_PROVIDER: 'bithuman',
      VOICE_LLM_MODEL: 'gemini-2.5-flash-native-audio-preview-12-2025',
      VOICE_LLM_FALLBACK: 'gemini-2.0-flash-exp',
      VOICE_STT_MODEL: 'google-stt-v2',
      VOICE_STT_FALLBACK: 'deepgram',
      VOICE_TTS_MODEL: 'google-tts',
      VOICE_TTS_FALLBACK: 'elevenlabs',
      AVATAR_LLM_MODEL: 'gemini-3.1-flash-live-preview',
      AVATAR_LLM_FALLBACK: 'gemini-2.5-flash',
      AVATAR_STT_MODEL: 'google-stt-v2',
      AVATAR_STT_FALLBACK: 'deepgram',
      AVATAR_TTS_MODEL: 'google-tts',
      AVATAR_TTS_FALLBACK: 'elevenlabs',
    };

    configs.forEach(c => {
      // Strip AGENT_ prefix for frontend state matching
      const cleanKey = c.key.replace(/^AGENT_/, '');
      configMap[cleanKey] = c.value;
    });

    res.json({ success: true, config: configMap });
  } catch (error) {
    next(error);
  }
});

router.post('/agent-config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        const fullKey = key.startsWith('AGENT_') ? key : `AGENT_${key}`;
        await prisma.siteConfig.upsert({
          where: { key: fullKey },
          update: { value },
          create: { key: fullKey, value }
        });
      }
    }
    res.json({ success: true, message: 'Live Agent configuration updated successfully' });
  } catch (error) {
    next(error);
  }
});

// ─── 16. I-Assist Usage Stats ───
router.get('/iassist-stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalSessions,
      completedSessions,
      totalAssistants,
      totalDocuments,
      aggregates,
      activeUsers,
      recentSessions
    ] = await Promise.all([
      prisma.iAssistSession.count(),
      prisma.iAssistSession.count({ where: { status: 'COMPLETED' } }),
      prisma.iAssistant.count(),
      prisma.contextDocument.count(),
      prisma.iAssistSession.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { questionsAnswered: true, tokensUsed: true, durationSeconds: true },
        _avg: { durationSeconds: true, questionsAnswered: true },
      }),
      prisma.iAssistSession.groupBy({
        by: ['userId'],
        _count: true,
      }),
      prisma.iAssistSession.findMany({
        take: 5,
        orderBy: { startedAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          assistant: { select: { name: true, category: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        totalSessions,
        completedSessions,
        totalAssistants,
        totalDocuments,
        activeUsers: activeUsers.length,
        totalQuestions: aggregates._sum.questionsAnswered || 0,
        totalTokens: aggregates._sum.tokensUsed || 0,
        totalDurationSeconds: aggregates._sum.durationSeconds || 0,
        avgDurationSeconds: Math.round(aggregates._avg.durationSeconds || 0),
        avgQuestions: Math.round(aggregates._avg.questionsAnswered || 0),
      },
      recentSessions,
    });
  } catch (error) {
    next(error);
  }
});

// ─── 17. Audit Logs ───
router.get('/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { email: true, firstName: true } } }
    });
    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
});

export default router;
