import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

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
  /** Applicant CV, base64. Persisted so applications aren't received blind. */
  resumeBase64: z.string().optional(),
  resumeFileName: z.string().optional(),
  resumeMimeType: z.string().optional(),
});

/** Reject anything large enough to suggest it isn't a CV. */
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

router.post('/apply', async (req, res, next) => {
  try {
    const data = applySchema.parse(req.body);

    let fileData: Uint8Array<ArrayBuffer> | null = null;
    if (data.resumeBase64) {
      const buf = Buffer.from(data.resumeBase64, 'base64');
      if (buf.length > MAX_RESUME_BYTES) {
        throw new AppError('That CV is too large — please upload a file under 5MB.', 400);
      }
      // Copy into a plain ArrayBuffer — Prisma's Bytes type rejects the
      // SharedArrayBuffer-backed view a Node Buffer can carry.
      const copy = new Uint8Array(new ArrayBuffer(buf.length));
      copy.set(buf);
      fileData = copy;
    }

    await prisma.internshipApplication.create({
      data: {
        internshipId: data.internshipId ?? null,
        programTitle: data.programTitle,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        resumeFileName: data.resumeFileName ?? null,
        resumeMimeType: data.resumeMimeType ?? null,
        fileData,
      },
    });

    // Keep the audit trail too, minus the file bytes.
    await prisma.auditLog.create({
      data: {
        action: 'INTERNSHIP_APPLICATION',
        targetModel: 'Internship',
        targetId: data.internshipId || 'general',
        payload: { ...data, resumeBase64: undefined, hasResume: !!fileData } as any,
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
