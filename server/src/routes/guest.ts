import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { consumeGuestAction, peekGuestQuota, resetGuestQuota } from '../lib/guestQuota';
import { withFallback } from '../services/resume/resumeAiService';
import { extractPdfText, extractDocxText } from '../services/resume/textExtract';
import { parseResumeText } from '../services/resume/parseResume';
import { parseLinkedInText, looksLikeLinkedIn } from '../services/resume/parseLinkedIn';
import { sanitizeResumeData } from '../services/resume/resumeData';

/**
 * Stateless tool endpoints for signed-out visitors.
 *
 * These take the résumé in the request body rather than a `:id`, so nothing is
 * written to the database and no user record is invented. Guest work lives in
 * the browser until they sign in, at which point the client migrates it to a
 * real résumé via the authenticated API.
 *
 * Saving and exporting are deliberately absent — those are the conversion
 * points and require an account.
 */
const router = Router();

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const clientIp = (req: Request) => req.ip || req.socket.remoteAddress || 'unknown';

/* The browser's own guest id. Falls back to the IP so a client that doesn't
   send one still gets a limit rather than unlimited access. */
const guestId = (req: Request) => {
  const header = req.get('x-guest-id');
  return header && header.length >= 8 ? header.slice(0, 64) : `ip:${clientIp(req)}`;
};

/** Spend one free action, or reject with the upsell signal the client shows. */
const spend = (req: Request) => {
  const state = consumeGuestAction(clientIp(req), guestId(req));
  if (!state.allowed) {
    throw new AppError(
      state.reason === 'ip'
        ? 'This network has made a lot of free requests today. Sign in to keep going — it\'s free.'
        : `You've used all ${state.limit} free AI actions. Sign in to keep going — it's free.`,
      402
    );
  }
  return state;
};

/** How many free actions this visitor has left. */
router.get('/quota', (req: Request, res: Response) => {
  res.json({ success: true, quota: peekGuestQuota(clientIp(req), guestId(req)) });
});

/* ── Import: parse a CV without storing it ──────────────────────────────── */
const importSchema = z.object({
  fileBase64: z.string().min(1),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
});

router.post('/import', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileBase64, fileName = '', mimeType = '' } = importSchema.parse(req.body);
    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.length > MAX_UPLOAD_BYTES) {
      throw new AppError('That file is too large — please upload one under 5MB.', 400);
    }

    const isDocx =
      fileName.toLowerCase().endsWith('.docx') ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const text = isDocx ? await extractDocxText(buffer) : await extractPdfText(buffer);

    if (text.trim().length < 40) {
      throw new AppError('Could not read enough text from that file. Try a text-based PDF or DOCX.', 400);
    }

    // Parsing is deterministic and cheap, so it doesn't spend a free action.
    const parsed = looksLikeLinkedIn(text) ? parseLinkedInText(text) : parseResumeText(text);
    res.json({ success: true, data: sanitizeResumeData(parsed), quota: peekGuestQuota(clientIp(req), guestId(req)) });
  } catch (error) {
    next(error);
  }
});

/* ── AI actions — each spends one of the free allowance ─────────────────── */
router.post('/ai/rewrite-bullet', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bullet, tone } = z
      .object({ bullet: z.string().min(3), tone: z.string().optional() })
      .parse(req.body);
    const quota = spend(req);
    const { result } = await withFallback((p) => p.rewriteBullet(bullet, (tone as any) || 'impact'));
    res.json({ success: true, text: result, quota });
  } catch (error) {
    next(error);
  }
});

router.post('/ai/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resume, jd } = z.object({ resume: z.any(), jd: z.string().optional() }).parse(req.body);
    const quota = spend(req);
    const { result } = await withFallback((p) => p.generateSummary(sanitizeResumeData(resume), jd));
    res.json({ success: true, text: result, quota });
  } catch (error) {
    next(error);
  }
});

router.post('/ai/cover-letter', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resume, company, role, manager, tone, jd } = z
      .object({
        resume: z.any(),
        company: z.string().optional(),
        role: z.string().optional(),
        manager: z.string().optional(),
        tone: z.string().optional(),
        jd: z.string().optional(),
      })
      .parse(req.body);
    const quota = spend(req);
    const { result } = await withFallback((p) =>
      p.coverLetter(sanitizeResumeData(resume), {
        company: company || '',
        role: role || '',
        hiringManager: manager || '',
        tone: (tone as any) || 'professional',
        jd: jd || '',
      })
    );
    res.json({ success: true, body: result, quota });
  } catch (error) {
    next(error);
  }
});

router.post('/ai/interview-prep', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resume, jd, role } = z
      .object({ resume: z.any(), jd: z.string().optional(), role: z.string().optional() })
      .parse(req.body);
    const quota = spend(req);
    const { result } = await withFallback((p) =>
      p.interviewPrep(sanitizeResumeData(resume), { jd: jd || '', role })
    );
    res.json({ success: true, ...result, quota });
  } catch (error) {
    next(error);
  }
});

/* Development helper: clear guest allowances. Never enabled in production. */
if (process.env.NODE_ENV !== 'production') {
  router.post('/reset-quota', (_req: Request, res: Response) => {
    resetGuestQuota();
    res.json({ success: true, message: 'Guest allowances reset' });
  });
}

export default router;
