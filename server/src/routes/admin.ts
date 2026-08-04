import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserRole, UserStatus, TemplateCategory, InternshipType, CourseCategory, MaterialType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { sendPasswordSetEmail } from '../services/emailService';

const router = Router();

// Protect ALL admin routes with authenticate + authorize(UserRole.ADMIN)
router.use(authenticate, authorize(UserRole.ADMIN));

/** Express 5 types route params as `string | string[]`; collapse to a single id. */
const routeId = (req: Request): string =>
  Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

/**
 * Record an admin mutation in the audit trail. Never throws — an audit write
 * failing must not roll back the action the admin actually asked for.
 */
const recordAudit = async (
  req: Request,
  action: string,
  targetModel?: string,
  targetId?: string,
  payload?: unknown
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user?.id ?? null,
        action,
        targetModel,
        targetId,
        payload: payload === undefined ? undefined : (payload as any),
        ipAddress: req.ip,
      },
    });
  } catch (error) {
    console.error(`Failed to write audit log for ${action}:`, error);
  }
};

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
      webinarDate: z.string().nullable().optional(),
      isPublished: z.boolean().optional().default(false),
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
        webinarDate: data.webinarDate ? new Date(data.webinarDate) : null,
        isPublished: data.isPublished,
      }
    });

    res.status(201).json({ success: true, batch });
  } catch (error) {
    next(error);
  }
});


// Update a batch (rename, reschedule, or change status — archiving is the
// non-destructive alternative to deleting).
router.patch('/batches/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      name: z.string().min(1).optional(),
      courseId: z.string().min(1).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      maxStudents: z.number().int().optional(),
      driveFolder: z.string().nullable().optional(),
      status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
      webinarDate: z.string().nullable().optional(),
      isPublished: z.boolean().optional(),
    }).parse(req.body);

    const batch = await prisma.batch.update({
      where: { id: routeId(req) },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        webinarDate:
          data.webinarDate === undefined ? undefined : data.webinarDate ? new Date(data.webinarDate) : null,
      },
    });
    await recordAudit(req, 'BATCH_UPDATED', 'Batch', batch.id, data);
    res.json({ success: true, batch });
  } catch (error) {
    next(error);
  }
});

/**
 * Delete a batch.
 *
 * Enrolments, scheduled classes and study materials all cascade, so this
 * destroys a cohort's entire record. When any of those exist the request is
 * refused with the counts unless ?confirm=true — the caller has to have seen
 * what they're removing.
 */
router.delete('/batches/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = routeId(req);
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: { _count: { select: { students: true, schedules: true, materials: true } } },
    });
    if (!batch) throw new AppError('Batch not found', 404);

    const { students, schedules, materials } = batch._count;
    const total = students + schedules + materials;

    if (total > 0 && req.query.confirm !== 'true') {
      return res.status(409).json({
        success: false,
        requiresConfirmation: true,
        message:
          `Deleting "${batch.name}" will also remove ${students} enrolment(s), ` +
          `${schedules} scheduled class(es) and ${materials} study material(s). ` +
          'Archive it instead to keep the record.',
        counts: { students, schedules, materials },
      });
    }

    await prisma.batch.delete({ where: { id } });
    await recordAudit(req, 'BATCH_DELETED', 'Batch', id, { name: batch.name, ...batch._count });
    res.json({ success: true, message: `Batch "${batch.name}" deleted.` });
  } catch (error) {
    next(error);
  }
});


/**
 * Enrol a user into a batch.
 *
 * This is the moment someone becomes a student: buying or being placed on a
 * cohort is what earns the role, so a SITE_USER is promoted here rather than
 * being created as a STUDENT up front. Admins and existing students keep the
 * role they have.
 */
router.post('/batches/:id/students', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batchId = routeId(req);
    const { userId, email } = z
      .object({ userId: z.string().optional(), email: z.string().email().optional() })
      .parse(req.body);

    if (!userId && !email) throw new AppError('Provide a userId or an email.', 400);

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { _count: { select: { students: true } } },
    });
    if (!batch) throw new AppError('Batch not found', 404);
    if (batch._count.students >= batch.maxStudents) {
      throw new AppError(`"${batch.name}" is full (${batch.maxStudents} seats).`, 409);
    }

    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findUnique({ where: { email: email! } });
    if (!user) throw new AppError('User not found. Invite them first.', 404);

    const existing = await prisma.batchStudent.findUnique({
      where: { batchId_studentId: { batchId, studentId: user.id } },
    });
    if (existing) throw new AppError(`${user.email} is already enrolled in this batch.`, 409);

    const promoted = user.role === UserRole.SITE_USER;

    await prisma.$transaction([
      prisma.batchStudent.create({ data: { batchId, studentId: user.id } }),
      ...(promoted
        ? [prisma.user.update({ where: { id: user.id }, data: { role: UserRole.STUDENT } })]
        : []),
    ]);

    await recordAudit(req, 'STUDENT_ENROLLED', 'Batch', batchId, {
      email: user.email,
      promotedToStudent: promoted,
    });

    res.status(201).json({
      success: true,
      promoted,
      message: promoted
        ? `${user.email} enrolled and upgraded to Student.`
        : `${user.email} enrolled.`,
    });
  } catch (error) {
    next(error);
  }
});

/** Remove someone from a batch. Their role is left alone — they may be on others. */
router.delete('/batches/:id/students/:studentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batchId = routeId(req);
    const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;

    await prisma.batchStudent.delete({
      where: { batchId_studentId: { batchId, studentId } },
    });
    await recordAudit(req, 'STUDENT_UNENROLLED', 'Batch', batchId, { studentId });
    res.json({ success: true, message: 'Student removed from batch.' });
  } catch (error) {
    next(error);
  }
});

/** Who is on this batch. */
router.get('/batches/:id/students', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const students = await prisma.batchStudent.findMany({
      where: { batchId: routeId(req) },
      include: { student: { select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true } } },
      orderBy: { enrolledAt: 'desc' },
    });
    res.json({ success: true, students: students.map((s) => ({ ...s.student, enrolledAt: s.enrolledAt })) });
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

/* ─── 5. Upcoming Batches ───────────────────────────────────────────────
   Removed. "Upcoming" is now a published Batch rather than a separate record,
   so the public listing can't drift from what operations actually runs. Admin
   publishes a batch via PATCH /admin/batches/:id { isPublished, webinarDate }
   and reads them from GET /admin/batches. */

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

// ─── 16. Menu Editor ───
router.get('/menu', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.menuItem.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, items });
  } catch (error) {
    next(error);
  }
});

const menuItemSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  icon: z.string().nullable().optional(),
});

router.post('/menu', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = menuItemSchema.parse(req.body);
    const item = await prisma.menuItem.create({ data });
    await recordAudit(req, 'MENU_ITEM_CREATED', 'MenuItem', item.id, data);
    res.status(201).json({ success: true, item });
  } catch (error) {
    next(error);
  }
});

router.patch('/menu/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = menuItemSchema.partial().parse(req.body);
    const item = await prisma.menuItem.update({ where: { id: routeId(req) }, data });
    await recordAudit(req, 'MENU_ITEM_UPDATED', 'MenuItem', item.id, data);
    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
});

router.delete('/menu/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.menuItem.delete({ where: { id: routeId(req) } });
    await recordAudit(req, 'MENU_ITEM_DELETED', 'MenuItem', routeId(req));
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    next(error);
  }
});

// ─── 17. Hero Banners ───
router.get('/banners', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banners = await prisma.heroBanner.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, banners });
  } catch (error) {
    next(error);
  }
});

const bannerSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  ctaText: z.string().nullable().optional(),
  ctaLink: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

router.post('/banners', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = bannerSchema.parse(req.body);
    const banner = await prisma.heroBanner.create({ data });
    await recordAudit(req, 'BANNER_CREATED', 'HeroBanner', banner.id, data);
    res.status(201).json({ success: true, banner });
  } catch (error) {
    next(error);
  }
});

router.patch('/banners/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = bannerSchema.partial().parse(req.body);
    const banner = await prisma.heroBanner.update({ where: { id: routeId(req) }, data });
    await recordAudit(req, 'BANNER_UPDATED', 'HeroBanner', banner.id, data);
    res.json({ success: true, banner });
  } catch (error) {
    next(error);
  }
});

router.delete('/banners/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.heroBanner.delete({ where: { id: routeId(req) } });
    await recordAudit(req, 'BANNER_DELETED', 'HeroBanner', routeId(req));
    res.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    next(error);
  }
});

// ─── 18. Resume Templates ───
router.get('/templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await prisma.resumeTemplate.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, templates });
  } catch (error) {
    next(error);
  }
});

const templateSchema = z.object({
  name: z.string().min(1),
  category: z.nativeEnum(TemplateCategory).optional(),
  htmlTemplate: z.string().min(1),
  cssStyles: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

router.post('/templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = templateSchema.parse(req.body);
    const template = await prisma.resumeTemplate.create({ data });
    await recordAudit(req, 'TEMPLATE_CREATED', 'ResumeTemplate', template.id, { name: data.name });
    res.status(201).json({ success: true, template });
  } catch (error) {
    next(error);
  }
});

router.patch('/templates/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = templateSchema.partial().parse(req.body);
    const template = await prisma.resumeTemplate.update({ where: { id: routeId(req) }, data });
    await recordAudit(req, 'TEMPLATE_UPDATED', 'ResumeTemplate', template.id, { name: data.name });
    res.json({ success: true, template });
  } catch (error) {
    next(error);
  }
});

router.delete('/templates/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Soft delete — templates may still be referenced by saved user resumes.
    const template = await prisma.resumeTemplate.update({
      where: { id: routeId(req) },
      data: { isActive: false },
    });
    await recordAudit(req, 'TEMPLATE_DEACTIVATED', 'ResumeTemplate', template.id);
    res.json({ success: true, message: 'Template deactivated' });
  } catch (error) {
    next(error);
  }
});

// ─── 19. Tool Usage Analytics ───
router.get('/tool-usage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { toolName, page = '1', limit = '25' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 25;

    const where: any = {};
    if (toolName && typeof toolName === 'string') where.toolName = toolName;

    const [logs, total, byTool] = await Promise.all([
      prisma.toolUsageLog.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      prisma.toolUsageLog.count({ where }),
      prisma.toolUsageLog.groupBy({
        by: ['toolName'],
        _count: { toolName: true },
        _sum: { creditsConsumed: true },
      }),
    ]);

    res.json({ success: true, logs, total, page: pageNum, byTool });
  } catch (error) {
    next(error);
  }
});

// ─── 20. Internship Programs ───
router.get('/internships', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const internships = await prisma.internship.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, internships });
  } catch (error) {
    next(error);
  }
});

const internshipSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  programType: z.nativeEnum(InternshipType),
  duration: z.string().min(1),
  eligibility: z.string().nullable().optional(),
  learningOutcomes: z.array(z.string()).optional(),
  projectHighlights: z.array(z.object({ title: z.string(), description: z.string() })).optional(),
  applicationLink: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const toInternshipData = (d: any) => ({
  ...d,
  startDate: d.startDate ? new Date(d.startDate) : undefined,
  learningOutcomes: d.learningOutcomes as any,
  projectHighlights: d.projectHighlights as any,
});

router.post('/internships', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = internshipSchema.parse(req.body);
    const internship = await prisma.internship.create({ data: toInternshipData(data) });
    await recordAudit(req, 'INTERNSHIP_CREATED', 'Internship', internship.id, { title: data.title });
    res.status(201).json({ success: true, internship });
  } catch (error) {
    next(error);
  }
});

router.patch('/internships/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = internshipSchema.partial().parse(req.body);
    const internship = await prisma.internship.update({
      where: { id: routeId(req) },
      data: toInternshipData(data),
    });
    await recordAudit(req, 'INTERNSHIP_UPDATED', 'Internship', internship.id, { title: data.title });
    res.json({ success: true, internship });
  } catch (error) {
    next(error);
  }
});

router.delete('/internships/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Soft delete — applications reference the programme.
    const internship = await prisma.internship.update({
      where: { id: routeId(req) },
      data: { isActive: false },
    });
    await recordAudit(req, 'INTERNSHIP_DEACTIVATED', 'Internship', internship.id);
    res.json({ success: true, message: 'Internship deactivated' });
  } catch (error) {
    next(error);
  }
});

// ─── 21. Corporate Courses ───
router.get('/corporate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [corporateCourses, courses] = await Promise.all([
      prisma.corporateCourse.findMany({
        include: { course: { select: { title: true, category: true } } },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.course.findMany({ where: { isActive: true }, select: { id: true, title: true } }),
    ]);
    res.json({ success: true, corporateCourses, courses });
  } catch (error) {
    next(error);
  }
});

const corporateSchema = z.object({
  courseId: z.string().min(1),
  customDescription: z.string().nullable().optional(),
  targetAudience: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

router.post('/corporate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = corporateSchema.parse(req.body);
    const entry = await prisma.corporateCourse.create({ data });
    await recordAudit(req, 'CORPORATE_COURSE_ADDED', 'CorporateCourse', entry.id, data);
    res.status(201).json({ success: true, entry });
  } catch (error) {
    next(error);
  }
});

router.patch('/corporate/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = corporateSchema.partial().parse(req.body);
    const entry = await prisma.corporateCourse.update({ where: { id: routeId(req) }, data });
    await recordAudit(req, 'CORPORATE_COURSE_UPDATED', 'CorporateCourse', entry.id, data);
    res.json({ success: true, entry });
  } catch (error) {
    next(error);
  }
});

router.delete('/corporate/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.corporateCourse.delete({ where: { id: routeId(req) } });
    await recordAudit(req, 'CORPORATE_COURSE_REMOVED', 'CorporateCourse', routeId(req));
    res.json({ success: true, message: 'Removed from corporate page' });
  } catch (error) {
    next(error);
  }
});

// ─── 22. Courses ───
router.get('/courses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { batches: true } } },
    });
    res.json({ success: true, courses });
  } catch (error) {
    next(error);
  }
});

const moduleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  duration: z.string().optional(),
  topics: z.array(z.string()).optional(),
});

const courseSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  category: z.nativeEnum(CourseCategory),
  description: z.string().min(1),
  shortDesc: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  prerequisites: z.string().nullable().optional(),
  careerOutcomes: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  modules: z.array(moduleSchema).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

/** URL-safe slug from the title, used when the admin doesn't supply one. */
const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

/** Slugs are unique; append a counter rather than failing the save. */
const uniqueSlug = async (base: string, excludeId?: string) => {
  let candidate = base || 'course';
  for (let i = 2; i < 50; i += 1) {
    const clash = await prisma.course.findUnique({ where: { slug: candidate } });
    if (!clash || clash.id === excludeId) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
};

const toCourseData = (d: any) => ({
  ...d,
  // Give every module a stable id so the student progress tracker can
  // reference them even after the list is reordered.
  modules: d.modules
    ? (d.modules.map((m: any, i: number) => ({
        id: m.id || `m${i + 1}`,
        title: m.title,
        duration: m.duration || '',
        topics: m.topics ?? [],
      })) as any)
    : undefined,
});

router.post('/courses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = courseSchema.parse(req.body);
    const slug = await uniqueSlug(data.slug ? slugify(data.slug) : slugify(data.title));
    const course = await prisma.course.create({ data: { ...toCourseData(data), slug } });
    await recordAudit(req, 'COURSE_CREATED', 'Course', course.id, { title: data.title });
    res.status(201).json({ success: true, course });
  } catch (error) {
    next(error);
  }
});

router.patch('/courses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = courseSchema.partial().parse(req.body);
    const id = routeId(req);
    const payload: any = toCourseData(data);
    if (data.slug || data.title) {
      payload.slug = await uniqueSlug(slugify(data.slug || data.title || ''), id);
    }
    const course = await prisma.course.update({ where: { id }, data: payload });
    await recordAudit(req, 'COURSE_UPDATED', 'Course', course.id, { title: data.title });
    res.json({ success: true, course });
  } catch (error) {
    next(error);
  }
});

router.delete('/courses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = routeId(req);
    // Batches reference the course, so a hard delete would orphan cohorts and
    // their students. Retire it instead — it disappears from the public site
    // and from new batch selection, existing batches keep working.
    const batches = await prisma.batch.count({ where: { courseId: id } });
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) throw new AppError('Course not found', 404);

    // A permanent delete is only safe when no batch references the course;
    // otherwise the cohorts would be orphaned.
    if (req.query.hard === 'true') {
      if (batches > 0) {
        return res.status(409).json({
          success: false,
          message:
            `"${course.title}" is used by ${batches} batch${batches === 1 ? '' : 'es'}, so it can't be ` +
            'deleted permanently. Retire it instead, or delete those batches first.',
          batches,
        });
      }
      await prisma.courseCertification.deleteMany({ where: { courseId: id } });
      await prisma.corporateCourse.deleteMany({ where: { courseId: id } });
      await prisma.course.delete({ where: { id } });
      await recordAudit(req, 'COURSE_DELETED', 'Course', id, { title: course.title });
      return res.json({ success: true, message: `Course "${course.title}" deleted permanently.` });
    }

    await prisma.course.update({ where: { id }, data: { isActive: false } });
    await recordAudit(req, 'COURSE_RETIRED', 'Course', id, { batches });
    res.json({
      success: true,
      message: batches
        ? `Course retired. ${batches} existing batch${batches === 1 ? '' : 'es'} are unaffected.`
        : 'Course retired.',
    });
  } catch (error) {
    next(error);
  }
});


// ─── Class Scheduler: update + delete ───
router.patch('/scheduler/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      title: z.string().min(1).optional(),
      batchId: z.string().min(1).optional(),
      dateTime: z.string().optional(),
      zoomLink: z.string().nullable().optional(),
      duration: z.number().int().nullable().optional(),
      status: z.string().optional(),
    }).parse(req.body);

    const schedule = await prisma.classSchedule.update({
      where: { id: routeId(req) },
      data: { ...data, dateTime: data.dateTime ? new Date(data.dateTime) : undefined },
    });
    await recordAudit(req, 'CLASS_UPDATED', 'ClassSchedule', schedule.id, data);
    res.json({ success: true, schedule });
  } catch (error) {
    next(error);
  }
});

router.delete('/scheduler/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = routeId(req);
    const schedule = await prisma.classSchedule.delete({ where: { id } });
    await recordAudit(req, 'CLASS_DELETED', 'ClassSchedule', id, { title: schedule.title });
    res.json({ success: true, message: `Class "${schedule.title}" removed.` });
  } catch (error) {
    next(error);
  }
});

// ─── Study Materials: update + delete ───
router.patch('/materials/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      title: z.string().min(1).optional(),
      batchId: z.string().min(1).optional(),
      type: z.nativeEnum(MaterialType).optional(),
      driveFileId: z.string().nullable().optional(),
      driveUrl: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      sortOrder: z.number().int().optional(),
    }).parse(req.body);

    const material = await prisma.studyMaterial.update({ where: { id: routeId(req) }, data });
    await recordAudit(req, 'MATERIAL_UPDATED', 'StudyMaterial', material.id, data);
    res.json({ success: true, material });
  } catch (error) {
    next(error);
  }
});

router.delete('/materials/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = routeId(req);
    const material = await prisma.studyMaterial.delete({ where: { id } });
    await recordAudit(req, 'MATERIAL_DELETED', 'StudyMaterial', id, { title: material.title });
    res.json({ success: true, message: `Material "${material.title}" removed.` });
  } catch (error) {
    next(error);
  }
});

// ─── Certifications: list + update (create/delete already existed) ───
router.get('/certifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, page = '1', limit = '25' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 25;

    const where: any = {};
    if (search && typeof search === 'string') {
      where.OR = [{ name: { contains: search } }, { provider: { contains: search } }];
    }

    const [total, certifications] = await Promise.all([
      prisma.certification.count({ where }),
      prisma.certification.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
    ]);

    res.json({
      success: true,
      certifications,
      pagination: { total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/certifications/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      name: z.string().min(1).optional(),
      provider: z.string().nullable().optional(),
      link: z.string().nullable().optional(),
      prerequisite: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
      ctaEnabled: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    }).parse(req.body);

    const certification = await prisma.certification.update({ where: { id: routeId(req) }, data });
    await recordAudit(req, 'CERTIFICATION_UPDATED', 'Certification', certification.id, data);
    res.json({ success: true, certification });
  } catch (error) {
    next(error);
  }
});

// ─── Users: suspend / reactivate ───
router.patch('/users/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = z.object({ status: z.nativeEnum(UserStatus) }).parse(req.body);
    const id = routeId(req);

    // Locking yourself out of the admin panel is not a recoverable mistake.
    if (id === (req as any).user?.id && status !== UserStatus.ACTIVE) {
      throw new AppError('You cannot suspend your own account.', 400);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, email: true, status: true },
    });
    await recordAudit(req, 'USER_STATUS_CHANGED', 'User', id, { status });
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});


/**
 * Delete a user.
 *
 * Enrolments, progress, résumés and tool history all cascade, so this erases
 * a person's entire record. Suspending (PATCH /users/:id/status) is the usual
 * answer; deletion is refused unless ?confirm=true so the caller has seen the
 * counts first.
 */
router.delete('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = routeId(req);
    if (id === (req as any).user?.id) {
      throw new AppError('You cannot delete your own account.', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { batchEnrollments: true, builderResumes: true, progress: true } },
      },
    });
    if (!user) throw new AppError('User not found', 404);

    const { batchEnrollments, builderResumes, progress } = user._count;
    const total = batchEnrollments + builderResumes + progress;

    if (total > 0 && req.query.confirm !== 'true') {
      return res.status(409).json({
        success: false,
        requiresConfirmation: true,
        message:
          `Deleting ${user.email} will also remove ${batchEnrollments} enrolment(s), ` +
          `${builderResumes} résumé(s) and ${progress} progress record(s). ` +
          'Suspend the account instead to keep the history.',
        counts: { batchEnrollments, builderResumes, progress },
      });
    }

    await prisma.user.delete({ where: { id } });
    await recordAudit(req, 'USER_DELETED', 'User', id, { email: user.email });
    res.json({ success: true, message: `${user.email} deleted.` });
  } catch (error) {
    next(error);
  }
});

// Dismiss a certification enquiry once it has been dealt with.
router.delete('/cert-inquiries/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = routeId(req);
    await prisma.certificationInquiry.delete({ where: { id } });
    await recordAudit(req, 'CERT_INQUIRY_DELETED', 'CertificationInquiry', id);
    res.json({ success: true, message: 'Enquiry removed.' });
  } catch (error) {
    next(error);
  }
});

// ─── 15. Audit Logs ───
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
