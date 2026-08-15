import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { consumeGuestAction, peekGuestQuota, resetGuestQuota } from '../lib/guestQuota';
import { withFallback } from '../services/resume/resumeAiService';
import { looksLikePdf, looksLikeDocx, extractPdfText, extractDocxText } from '../services/resume/textExtract';
import { parseResumeText } from '../services/resume/parseResume';
import { parseLinkedInText, looksLikeLinkedIn } from '../services/resume/parseLinkedIn';
import { sanitizeResumeData } from '../services/resume/resumeData';
import { aiLimiter } from '../middleware/rateLimit';
import { prisma } from '../lib/prisma';

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

    /* Check the bytes before parsing: the extractor throws on anything that
       isn't really a document, which surfaced as a 500 rather than telling
       the visitor their file was the problem. */
    if (!(isDocx ? looksLikeDocx(buffer) : looksLikePdf(buffer))) {
      throw new AppError(
        "That file isn't a readable PDF or Word document. Please upload the original CV file.",
        400
      );
    }

    let text = '';
    try {
      text = isDocx ? await extractDocxText(buffer) : await extractPdfText(buffer);
    } catch {
      throw new AppError('We could not read that file. Please try a different PDF or Word document.', 400);
    }

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
router.post('/ai/rewrite-bullet', aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
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

router.post('/ai/summary', aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resume, jd } = z.object({ resume: z.any(), jd: z.string().optional() }).parse(req.body);
    const quota = spend(req);
    const { result } = await withFallback((p) => p.generateSummary(sanitizeResumeData(resume), jd));
    res.json({ success: true, text: result, quota });
  } catch (error) {
    next(error);
  }
});

router.post('/ai/cover-letter', aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
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

router.post('/ai/interview-prep', aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
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

/* ── Live Agent Configuration ───────────────────────────────────────────── */
router.get('/agent-prompt', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { key: 'AGENT_SYSTEM_PROMPT' }
    });
    // Default prompt if not configured in DB
    const defaultPrompt = `You are NxtGen Academy's 24/7 Official AI Co-ordinator. You speak directly to website visitors over a real-time full-duplex audio call.

=== BRAND & SERVICES KNOWLEDGE ===
- Company: NxtGen Academy — a flagship product by PAVY Consultancy Services Pvt Ltd
- Mission: "Where Careers Are Born, Not Found."

INDIVIDUAL SERVICES:
1. Courses:
   - Data Analytics & AI (Python, ML, PowerBI, Tableau, GenAI)
   - Database Management (SQL & Azure DBA, Oracle DBA, PostgreSQL DBA)
   - Cyber Security (Security+, CompTIA, CISSP, SOC Analyst)

2. Certifications: Microsoft Azure, AWS, Google Cloud, Cisco, CompTIA, PMI, IBM, Oracle, Red Hat, VMware, Salesforce, Linux Foundation

3. Internships (36-Week Programs with Guaranteed Placement):
   - Data Analytics Internship
   - Generative AI Internship
   - Agentic AI Internship
   - Database Management Internship

4. AI Tools Store (AI Career Tools):
   - AI Resume Builder
   - ATS Score Checker
   - JD Resume Tailor
   - LinkedIn Profile Analyser
   - Cover Letter Builder
   - Interview Prep Kit
   - I-Assist (Real-time Interview Co-pilot)
   - AI Mock Interview

5. Technical Job Support (Strictly for Working Professionals):
   - Data Analytics & AI Support (Python, ML, PowerBI, GenAI)
   - Data Engineering Support (Microsoft Fabric, Databricks)
   - Database Management Support (SQL & Azure DBA, Oracle DBA, PostgreSQL DBA)

CORPORATE PROGRAMS:
1. Upskilling & Reskilling Training — Bulk corporate AI training programs
2. Bulk Enrollments — Team enrollments in courses and certifications
3. AI & Tech Consulting — AI strategy, cyber security, DBA consulting
4. Custom AI Solutions — Custom AI/ML model development for enterprises

=== CONVERSATIONAL RULES ===
1. Greet the visitor warmly immediately: "Hello! Welcome to NxtGen Academy. I'm your AI Co-ordinator. How can I help you today with courses, certifications, internships, or career tools?"
2. Respond in voice audio to both spoken audio and text messages typed by the visitor.
3. Answer questions accurately, concisely, and professionally (1-3 plain spoken sentences).
4. Direct visitors to appropriate pages: /courses, /certifications, /internship, /tools, /job-support, /corporate, or /connect-us.
5. GOODBYE RULE: If the visitor says "goodbye", "bye", "see you later", or "have a good day", respond politely: "Thank you for reaching out to NxtGen Academy! We wish you great success in your learning journey. Goodbye!" and end the turn.
6. Speak ONLY plain conversational English. Avoid markdown, lists, or unpronounceable symbols.
7. If asked about pricing, say: "Our advisors can share detailed pricing for your specific program. Please fill the contact form below or visit our connect-us page."`;

    res.json({ success: true, prompt: config?.value || defaultPrompt });
  } catch (error) {
    next(error);
  }
});

/* ── Public About Us & Agent Display Configuration ───────────────────────── */
router.get('/about-us-config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: {
        key: {
          in: [
            'AGENT_DISPLAY_IMAGE',
            'AGENT_SYSTEM_PROMPT',
            'VOICE_LLM_MODEL',
            'VOICE_STT_MODEL',
            'VOICE_TTS_MODEL',
            'VOICE_PERSONA',
            'CONTACT_EMAIL_PRIMARY',
            'CONTACT_EMAIL_ADMISSIONS',
            'CONTACT_PHONE',
            'CONTACT_ADDRESS',
          ]
        }
      }
    });

    const map: Record<string, string> = {
      AGENT_DISPLAY_IMAGE: '/assets/pavy_receptionist.jpg',
      VOICE_LLM_MODEL: 'gemini-2.5-flash-native-audio-preview-12-2025',
      VOICE_STT_MODEL: 'google-stt-v2',
      VOICE_TTS_MODEL: 'google-tts',
      VOICE_PERSONA: 'Charon',
      CONTACT_EMAIL_PRIMARY: 'contact@nxtgenacademy.in',
      CONTACT_EMAIL_ADMISSIONS: 'admissions@nxtgenacademy.in',
      CONTACT_PHONE: '+91 96730-04500',
      CONTACT_ADDRESS: 'PAVY Consultancy Services Pvt Ltd, Tech Park Campus, Hyderabad, India',
    };

    configs.forEach(c => {
      map[c.key] = c.value;
    });

    res.json({ success: true, config: map });
  } catch (error) {
    next(error);
  }
});

/* ── Public AI Coordinator Text Chat ────────────────────────────────────── */
router.post('/coordinator-chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = z.object({
      message: z.string().min(1).max(2000),
      conversationHistory: z.array(z.object({
        role: z.enum(['user', 'model']),
        text: z.string(),
      })).max(30).optional(),
    }).parse(req.body);

    const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // Fetch system prompt from DB
    let systemPrompt = '';
    try {
      const config = await prisma.siteConfig.findUnique({ where: { key: 'AGENT_SYSTEM_PROMPT' } });
      systemPrompt = config?.value || '';
    } catch { /* use fallback below */ }

    if (!systemPrompt) {
      systemPrompt = `You are NxtGen Academy's 24/7 Official AI Co-ordinator. You answer visitor questions about courses, certifications, internships, AI Tools, Technical Job Support, and Corporate Programs. Be warm, concise, and professional. Reply in 1-3 short sentences.`;
    }

    if (!apiKey || apiKey === 'demo') {
      return res.json({
        success: true,
        reply: `Thank you for reaching out to NxtGen Academy! We offer courses in Data Analytics & AI, Database Management, and Cyber Security, along with certification prep, internships, and AI career tools. How can I help you today?`,
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt,
      });

      const result = await model.generateContent(message);
      const reply = result.response.text().trim();

      return res.json({
        success: true,
        reply: reply.length > 1000 ? reply.substring(0, 997) + '...' : reply,
      });
    } catch (geminiErr) {
      console.error('Gemini call failed in coordinator-chat:', geminiErr);
      return res.json({
        success: true,
        reply: `Thank you for your inquiry about "${message}". NxtGen Academy offers specialized programs in Data Analytics & AI, Database Management, and Cyber Security. Feel free to ask more details or connect with our team!`,
      });
    }
  } catch (error) {
    console.error('Coordinator chat error:', error);
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
