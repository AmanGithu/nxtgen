import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { desktopAuthService } from '../services/iassist/desktopAuthService';

const router = Router();

router.post('/authorize', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { state } = z.object({
      state: z.string().min(32).max(128),
    }).parse(req.body);

    const code = await desktopAuthService.generateCode(req.user!.id, state);
    res.json({ success: true, code });
  } catch (error) {
    next(error);
  }
});

router.post('/token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state } = z.object({
      code: z.string().length(64),
      state: z.string().min(32).max(128),
    }).parse(req.body);

    const result = await desktopAuthService.exchangeCode(code, state);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

export default router;
