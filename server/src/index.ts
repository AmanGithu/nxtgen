import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { sessionService } from './services/iassist/sessionService';

const app = express();

app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
// Audio chunks are posted as base64 JSON to /iassist/transcribe (up to ~7MB of base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', routes);

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

// I-Assist sessions are closed by the desktop client, so a crash leaves them
// ACTIVE forever. Sweep on boot and hourly thereafter.
const REAP_INTERVAL_MS = 60 * 60 * 1000;

async function reapStaleSessions() {
  try {
    const count = await sessionService.reapStaleSessions();
    if (count > 0) console.log(`Marked ${count} stale I-Assist session(s) as ABANDONED`);
  } catch (err) {
    console.error('Stale session sweep failed:', err);
  }
}

reapStaleSessions();
const reapTimer = setInterval(reapStaleSessions, REAP_INTERVAL_MS);
reapTimer.unref();

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
