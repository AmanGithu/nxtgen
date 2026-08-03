import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { assistantService } from '../services/iassist/assistantService';
import { contextDocService } from '../services/iassist/contextDocService';
import { sessionService } from '../services/iassist/sessionService';
import { aiQueryService, getVadConfig } from '../services/iassist/aiQueryService';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

function param(val: string | string[]): string {
  return Array.isArray(val) ? val[0] : val;
}

router.use(authenticate);

// ─── Assistants ───

router.get('/assistants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assistants = await assistantService.getAll(req.user!.id);
    res.json({ success: true, assistants });
  } catch (error) {
    next(error);
  }
});

router.post('/assistants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      name: z.string().min(1).max(100),
      category: z.enum(['BEHAVIORAL', 'TECHNICAL', 'SYSTEM_DESIGN', 'GENERAL']),
      targetRole: z.string().max(100).optional(),
      experienceYears: z.number().int().min(0).max(50).optional(),
      instructions: z.string().max(2000).optional(),
    }).parse(req.body);

    const assistant = await assistantService.create(req.user!.id, data);
    res.status(201).json({ success: true, assistant });
  } catch (error) {
    next(error);
  }
});

router.put('/assistants/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      name: z.string().min(1).max(100).optional(),
      category: z.enum(['BEHAVIORAL', 'TECHNICAL', 'SYSTEM_DESIGN', 'GENERAL']).optional(),
      targetRole: z.string().max(100).optional(),
      experienceYears: z.number().int().min(0).max(50).optional(),
      instructions: z.string().max(2000).optional(),
    }).parse(req.body);

    const assistant = await assistantService.update(param(req.params.id), req.user!.id, data);
    res.json({ success: true, assistant });
  } catch (error) {
    next(error);
  }
});

router.delete('/assistants/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assistantService.delete(param(req.params.id), req.user!.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/assistants/:id/materials', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      role: z.enum(['RESUME', 'JOB_DESCRIPTION', 'MATERIAL']),
      title: z.string().min(1).max(200),
      documentId: z.string().uuid().optional(),
      content: z.string().max(50000).optional(),
    }).refine(d => d.documentId || d.content, {
      message: 'Either documentId or content is required',
    }).parse(req.body);

    const material = await assistantService.addMaterial(param(req.params.id), req.user!.id, data);
    res.status(201).json({ success: true, material });
  } catch (error) {
    next(error);
  }
});

router.delete('/assistants/:assistantId/materials/:materialId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assistantService.removeMaterial(param(req.params.assistantId), param(req.params.materialId), req.user!.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ─── Documents ───

router.get('/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const result = await contextDocService.getAll(req.user!.id, search);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

router.get('/documents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await contextDocService.getById(param(req.params.id), req.user!.id);
    res.json({ success: true, document });
  } catch (error) {
    next(error);
  }
});

router.post('/documents', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    let document;

    if (req.file) {
      const title = z.string().min(1).max(200).parse(req.body.title);
      const description = req.body.description
        ? z.string().max(500).parse(req.body.description)
        : undefined;

      document = await contextDocService.createFromFile(req.user!.id, req.file, title, description);
    } else {
      const data = z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(500).optional(),
        content: z.string().min(1).max(100000),
      }).parse(req.body);

      document = await contextDocService.create(req.user!.id, data);
    }

    res.status(201).json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        description: document.description,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        wordCount: document.wordCount,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/documents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(500).nullable().optional(),
      content: z.string().min(1).max(100000).optional(),
    }).parse(req.body);

    const document = await contextDocService.update(param(req.params.id), req.user!.id, data);

    res.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        description: document.description,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        wordCount: document.wordCount,
        content: document.content,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/documents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await contextDocService.delete(param(req.params.id), req.user!.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ─── Analytics ───

router.get('/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const analytics = await sessionService.getAnalytics(userId);
    res.json({ success: true, analytics });
  } catch (error) {
    next(error);
  }
});

// ─── Sessions ───

router.get('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = z.enum(['week', 'month', 'all']).optional().parse(req.query.period);
    const sessions = await sessionService.getAll(req.user!.id, period);
    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
});

router.get('/sessions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await sessionService.getById(param(req.params.id), req.user!.id);
    res.json({ success: true, session });
  } catch (error) {
    next(error);
  }
});

router.post('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assistantId, platform } = z.object({
      assistantId: z.string().uuid(),
      platform: z.literal('desktop'),
    }).parse(req.body);

    const session = await sessionService.create(req.user!.id, assistantId, platform);
    res.status(201).json({ success: true, session });
  } catch (error) {
    next(error);
  }
});

router.patch('/sessions/:id/end', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = z.object({
      durationSeconds: z.number().int().min(0),
      questionsAnswered: z.number().int().min(0),
      tokensUsed: z.number().int().min(0),
    }).parse(req.body);

    await sessionService.end(param(req.params.id), req.user!.id, stats);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/sessions/:id/transcript', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      speaker: z.enum(['user', 'assistant']),
      text: z.string().min(1),
      isQuestion: z.boolean().default(false),
      response: z.string().optional(),
      tokens: z.number().int().default(0),
      timestamp: z.number().int().default(0),
    }).parse(req.body);

    await sessionService.addTranscript(param(req.params.id), req.user!.id, data);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ─── AI (desktop calls these) ───

router.post('/transcribe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { audio, mimeType, sessionId } = z.object({
      audio: z.string().max(7_000_000),
      mimeType: z.string(),
      sessionId: z.string().uuid(),
    }).parse(req.body);

    await sessionService.verifyOwnership(sessionId, req.user!.id);

    const audioBuffer = Buffer.from(audio, 'base64');
    const text = await aiQueryService.transcribeAudio(audioBuffer, mimeType);
    res.json({ success: true, text });
  } catch (error) {
    next(error);
  }
});

router.post('/query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      sessionId: z.string().uuid(),
      assistantId: z.string().uuid(),
      message: z.string().min(1).max(10000),
      conversationHistory: z.array(z.object({
        role: z.enum(['user', 'model']),
        text: z.string().max(10000),
      })).max(50).optional(),
      responseType: z.string().max(200).optional(),
    }).parse(req.body);

    await sessionService.verifyOwnership(data.sessionId, req.user!.id);
    await assistantService.getById(data.assistantId, req.user!.id);

    const result = await aiQueryService.query({
      assistantId: data.assistantId,
      message: data.message,
      conversationHistory: data.conversationHistory,
      responseType: data.responseType,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// Capture tuning for the desktop app. Admin-owned values, but readable by any
// authenticated user since the desktop needs them to start a session.
router.get('/config', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, vad: await getVadConfig() });
  } catch (error) {
    next(error);
  }
});

// Server-sent events variant of /query. Emits `delta` events while the model is
// still generating, then a final `done` event carrying the full text and usage.
router.post('/query/stream', async (req: Request, res: Response, next: NextFunction) => {
  let streamStarted = false;

  try {
    const data = z.object({
      sessionId: z.string().uuid(),
      assistantId: z.string().uuid(),
      message: z.string().min(1).max(10000),
      conversationHistory: z.array(z.object({
        role: z.enum(['user', 'model']),
        text: z.string().max(10000),
      })).max(50).optional(),
      responseType: z.string().max(200).optional(),
    }).parse(req.body);

    await sessionService.verifyOwnership(data.sessionId, req.user!.id);
    await assistantService.getById(data.assistantId, req.user!.id);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    streamStarted = true;

    let aborted = false;
    req.on('close', () => { aborted = true; });

    const send = (event: string, payload: unknown) => {
      if (aborted) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
    };

    const result = await aiQueryService.queryStream({
      assistantId: data.assistantId,
      message: data.message,
      conversationHistory: data.conversationHistory,
      responseType: data.responseType,
    }, (text) => send('delta', { text }));

    send('done', result);
    res.end();
  } catch (error) {
    // Once headers are flushed the error handler can no longer set a status, so
    // report the failure in-band and close the stream.
    if (streamStarted) {
      const message = error instanceof Error ? error.message : 'AI request failed';
      res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
      res.end();
      return;
    }
    next(error);
  }
});

export default router;
