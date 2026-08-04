import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { optionalAuthenticate } from '../middleware/auth';
import { consumeGuestAction, peekGuestQuota } from '../lib/guestQuota';
import { AppError } from '../middleware/errorHandler';
import { analyseLinkedIn } from '../services/linkedinAnalyser';
import { extractPdfText, extractDocxText } from '../services/resume/textExtract';

const router = Router();

router.use(optionalAuthenticate);

const clientIp = (req: Request) => req.ip || req.socket.remoteAddress || 'unknown';
const guestId = (req: Request) => {
  const header = req.get('x-guest-id');
  return header && header.length >= 8 ? header.slice(0, 64) : `ip:${clientIp(req)}`;
};

const analyseSchema = z.object({
  /** Raw profile text, when the user pastes rather than uploads. */
  text: z.string().optional(),
  /** Base64 file body, when the user uploads their LinkedIn PDF export. */
  fileBase64: z.string().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  /** Optional CV. When its name matches the profile, its achievements are
      used to write concrete drafts instead of bracketed placeholders. */
  resumeText: z.string().optional(),
  resumeBase64: z.string().optional(),
  resumeFileName: z.string().optional(),
  resumeMimeType: z.string().optional(),
});

const readUpload = async (base64: string, fileName = '', mimeType = '') => {
  const buffer = Buffer.from(base64, 'base64');
  const isDocx =
    fileName.toLowerCase().endsWith('.docx') ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return isDocx ? extractDocxText(buffer) : extractPdfText(buffer);
};

router.post('/analyse', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = analyseSchema.parse(req.body);

    let text = (body.text ?? '').trim();

    if (!text && body.fileBase64) {
      text = await readUpload(body.fileBase64, body.fileName, body.mimeType);
    }

    let resumeText = (body.resumeText ?? '').trim();
    if (!resumeText && body.resumeBase64) {
      resumeText = await readUpload(body.resumeBase64, body.resumeFileName, body.resumeMimeType);
    }

    if (text.trim().length < 40) {
      throw new AppError(
        'Could not read enough text from that profile. Paste your profile text, or upload the PDF LinkedIn exports from "Save to PDF" on your profile.',
        400
      );
    }

    // Signed-out visitors spend one of their free AI actions; members don't.
    let quota;
    if (!req.user) {
      quota = consumeGuestAction(clientIp(req), guestId(req));
      if (!quota.allowed) {
        throw new AppError(
          quota.reason === 'ip'
            ? 'This network has made a lot of free requests today. Sign in to keep going — it\'s free.'
            : `You've used all ${quota.limit} free AI actions. Sign in to keep going — it's free.`,
          402
        );
      }
    }

    const analysis = await analyseLinkedIn(text, resumeText || undefined);
    res.json({ success: true, analysis, ...(quota ? { quota } : {}) });
  } catch (error) {
    next(error);
  }
});

export default router;
