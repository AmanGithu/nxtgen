import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { setupWebSocketServer } from './websocket/server';
import { sessionService } from './services/iassist/sessionService';

import path from 'path';

const app = express();

app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve theme_assets media files statically
app.use('/theme_assets', express.static(path.join(__dirname, '../../client/public/theme_assets')));

app.use('/api', routes);

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

// Attach WebSocket server for real-time AI teleprompter & audio streams
setupWebSocketServer(server);

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
