import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('15m'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  /* Our own public origin. Cashfree needs an absolute, internet-reachable
     notify_url to post webhooks to — localhost is not reachable from their
     servers, so this must be a tunnel in development. */
  SERVER_PUBLIC_URL: z.string().optional(),
  /* Stripe — international collection. Absent keys disable the provider
     rather than crash boot, so a developer without credentials can still run
     everything else; checkout answers 503 and says why. */
  STRIPE_SECRET_KEY: z.string().optional(),
  /* Signing secret for the webhook endpoint. Without it we cannot tell a real
     Stripe callback from anyone who found the URL, so an unsigned request is
     rejected rather than trusted. */
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  /* Cashfree — domestic Indian collection (UPI, netbanking, RuPay), which
     Stripe cannot do for an Indian business. The client secret doubles as the
     webhook signing key, so there is no separate webhook secret. */
  CASHFREE_APP_ID: z.string().optional(),
  CASHFREE_SECRET_KEY: z.string().optional(),
  CASHFREE_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().default('noreply@nxtgen.academy'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_PRIMARY_MODEL: z.string().default('gemini-1.5-flash'),
  GEMINI_FALLBACK_MODEL: z.string().default('gemini-1.5-pro'),
  GEMINI_VOICE_MODEL: z.string().default('gemini-2.0-flash-exp'),
  LIVEKIT_URL: z.string().optional(),
  LIVEKIT_API_KEY: z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),
  AVATAR_BACKEND: z.string().optional(),
  BITHUMAN_API_SECRET: z.string().optional(),
  BITHUMAN_AVATAR_ID: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
