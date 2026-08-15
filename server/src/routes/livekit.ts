import { Router, Request, Response, NextFunction } from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';

const router = Router();

/**
 * GET /api/livekit/token?room=<roomName>
 *
 * Mints a signed LiveKit JWT for an anonymous visitor so they can join the
 * Contact AI Coordinator voice room without authenticating. The Python
 * Contact_agent.py worker listens on the same LiveKit cloud project and
 * auto-joins any room whose name matches its dispatch rules.
 *
 * This is intentionally public — the AI Receptionist is a guest-facing
 * feature and requiring login would defeat its purpose.
 */
router.get('/token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomName = (req.query.room as string) || `nxtgen-contact-${uuidv4().substring(0, 8)}`;

    const apiKey = env.LIVEKIT_API_KEY || process.env.LIVEKIT_API_KEY || 'APIPQvkToZaTs4y';
    const apiSecret = env.LIVEKIT_API_SECRET || process.env.LIVEKIT_API_SECRET || 'RhfrruEwP8HkmntKVFupJcTHewRjh4cEVsBYQXvn6Hd';
    const livekitUrl = env.LIVEKIT_URL || process.env.LIVEKIT_URL || 'wss://avatar-smh2w45h.livekit.cloud';

    const identity = `guest-${uuidv4().substring(0, 8)}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: 'Website Visitor',
    });
    at.addGrant({ roomJoin: true, room: roomName });

    const token = await at.toJwt();

    res.json({
      success: true,
      token,
      wsUrl: livekitUrl,
      roomName,
      identity,
    });
  } catch (error) {
    console.error('Error minting LiveKit guest token:', error);
    next(error);
  }
});

export default router;
