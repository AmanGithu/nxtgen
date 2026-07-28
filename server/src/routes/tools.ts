import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { aiService } from '../services/aiService';
import { pdfParserService } from '../services/pdfParser';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Protect ALL career tool endpoints
router.use(authenticate);

// ─── 1. AI Bullet Point Enhancer ───
router.post('/enhance-bullet', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bullet, mode } = z.object({
      bullet: z.string().min(1),
      mode: z.enum(['stronger', 'shorten', 'metrics']).optional().default('stronger'),
    }).parse(req.body);

    const enhancedBullet = await aiService.enhanceBulletPoint(bullet, mode);
    res.json({ success: true, original: bullet, enhanced: enhancedBullet });
  } catch (error) {
    next(error);
  }
});

// ─── 2. ATS Score Checker ───
router.post('/ats-score', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resumeText, jobDescription } = z.object({
      resumeText: z.string().min(10),
      jobDescription: z.string().optional(),
    }).parse(req.body);

    const result = await aiService.calculateATSScore(resumeText, jobDescription);
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

// ─── 3. JD Resume Tailor ───
router.post('/tailor-resume', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resumeText, jobDescription } = z.object({
      resumeText: z.string().min(10),
      jobDescription: z.string().min(10),
    }).parse(req.body);

    const result = await aiService.tailorResumeToJD(resumeText, jobDescription);
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

// ─── 4. Cover Letter Builder ───
router.post('/cover-letter', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resumeText, targetRole, companyName, jobDescription } = z.object({
      resumeText: z.string().min(10),
      targetRole: z.string().min(1),
      companyName: z.string().min(1),
      jobDescription: z.string().optional(),
    }).parse(req.body);

    const result = await aiService.generateCoverLetter(resumeText, targetRole, companyName, jobDescription);
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

// ─── 5. LinkedIn Profile Analyser ───
router.post('/linkedin-analyser', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileText } = z.object({
      profileText: z.string().min(10),
    }).parse(req.body);

    const result = await aiService.analyseLinkedInProfile(profileText);
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

// ─── 6. Interview Prep Kit ───
router.post('/interview-prep', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resumeText, jobDescription } = z.object({
      resumeText: z.string().min(10),
      jobDescription: z.string().min(10),
    }).parse(req.body);

    const result = await aiService.generateInterviewPrepKit(resumeText, jobDescription);
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

// ─── 7. Parse Resume PDF (Base64 or Raw Text) ───
router.post('/parse-resume-pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { base64Pdf, rawText } = z.object({
      base64Pdf: z.string().optional(),
      rawText: z.string().optional(),
    }).parse(req.body);

    let parsedData;
    if (base64Pdf) {
      const buffer = Buffer.from(base64Pdf, 'base64');
      parsedData = await pdfParserService.parseResumePdf(buffer);
    } else if (rawText) {
      parsedData = pdfParserService.getFallbackParsedData(rawText);
    } else {
      throw new AppError('Either base64Pdf or rawText is required', 400);
    }

    res.json({ success: true, parsedData });
  } catch (error) {
    next(error);
  }
});

export default router;
