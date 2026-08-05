import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { OAuthProvider } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { loginLimiter, registerLimiter } from '../middleware/rateLimit';
import { sendPasswordResetEmail } from '../services/emailService';
import crypto from 'crypto';

const router = Router();

const generateTokens = (user: { id: string; email: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );

  const refreshToken = jwt.sign(
    { id: user.id, jti: crypto.randomBytes(16).toString('hex') },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' as any }
  );

  return { accessToken, refreshToken };
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new AppError('Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError('Invalid credentials', 401);
    }

    /* Without this a suspended account can simply log in again and carry on —
       the admin's suspend action would change a column and nothing else. */
    if (user.status !== 'ACTIVE') {
      throw new AppError('This account has been suspended. Please contact support.', 403);
    }

    const tokens = generateTokens(user);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    next(error);
  }
});

/* Length alone let "password" through, and z.string() accepts "" — which
   created accounts with no name at all, showing as a blank avatar and an
   empty greeting throughout the app. */
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', 'qwerty123',
  'iloveyou', 'admin123', 'welcome1', 'letmein1', 'abc12345', 'football',
]);

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(180),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(200)
    .refine((v) => !COMMON_PASSWORDS.has(v.toLowerCase()), 'That password is too common.')
    .refine((v) => /[a-zA-Z]/.test(v) && /[0-9]/.test(v), 'Password needs at least one letter and one number.'),
  firstName: z.string().trim().min(1, 'First name is required.').max(80),
  lastName: z.string().trim().min(1, 'Last name is required.').max(80),
});

router.post('/register', registerLimiter, async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email already in use', 409);

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'SITE_USER',
      },
    });

    const tokens = generateTokens(user);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      success: true,
      tokens,
      user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/google', async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) throw new AppError('Code required', 400);

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${env.CLIENT_URL}/auth/callback/google`,
      }),
    });
    const tokenData: any = await tokenRes.json();
    if (!tokenData.access_token) throw new AppError('Failed to exchange token', 400);

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo: any = await userRes.json();

    let user = await prisma.user.findUnique({ where: { email: userInfo.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          firstName: userInfo.given_name || 'User',
          lastName: userInfo.family_name || '',
          role: 'SITE_USER',
          oauthProvider: OAuthProvider.GOOGLE,
        },
      });
    }

    const existingAccount = await prisma.account.findFirst({
      where: { userId: user.id, provider: OAuthProvider.GOOGLE },
    });

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId: user.id,
          provider: OAuthProvider.GOOGLE,
          providerAccountId: userInfo.id,
          accessToken: tokenData.access_token,
        },
      });
    }

    const tokens = generateTokens(user);
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      tokens,
      user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/github', async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) throw new AppError('Code required', 400);

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${env.CLIENT_URL}/auth/callback/github`,
      }),
    });
    const tokenData: any = await tokenRes.json();
    if (!tokenData.access_token) throw new AppError('Failed to exchange token', 400);

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/json' },
    });
    const userInfo: any = await userRes.json();

    let email = userInfo.email;
    if (!email) {
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/json' },
      });
      const emails: any = await emailRes.json();
      if (Array.isArray(emails) && emails.length > 0) {
        const primary = emails.find((e: any) => e.primary);
        email = primary ? primary.email : emails[0].email;
      }
    }

    if (!email) throw new AppError('GitHub email not accessible', 400);

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          firstName: userInfo.name ? userInfo.name.split(' ')[0] : userInfo.login,
          lastName: userInfo.name ? userInfo.name.split(' ').slice(1).join(' ') : '',
          role: 'SITE_USER',
          oauthProvider: OAuthProvider.GITHUB,
        },
      });
    }

    const existingAccount = await prisma.account.findFirst({
      where: { userId: user.id, provider: OAuthProvider.GITHUB },
    });

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId: user.id,
          provider: OAuthProvider.GITHUB,
          providerAccountId: userInfo.id.toString(),
          accessToken: tokenData.access_token,
        },
      });
    }

    const tokens = generateTokens(user);
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      tokens,
      user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/set-password', async (req, res, next) => {
  try {
    const { token, password } = z
      .object({ token: z.string(), password: z.string().min(8) })
      .parse(req.body);

    const invite = await prisma.userInviteToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!invite || invite.expiresAt < new Date() || invite.usedAt) {
      throw new AppError('Invalid or expired token', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: invite.userId },
      data: { passwordHash, mustChangePassword: false },
    });

    await prisma.userInviteToken.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    res.json({ success: true, message: 'Password set successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await prisma.userInviteToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      await sendPasswordResetEmail(email, token);
    }

    res.json({ success: true, message: 'If email exists, a reset link was sent.' });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', loginLimiter, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('Refresh token required', 400);

    const session = await prisma.session.findUnique({ where: { refreshToken } });
    if (!session || session.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) throw new AppError('User not found', 404);
    if (user.status !== 'ACTIVE') {
      throw new AppError('This account has been suspended.', 403);
    }

    /* Rotate: the presented token is consumed and replaced. Without this a
       refresh token is a permanent credential — anyone who captures one keeps
       minting access tokens forever, and signing out cannot revoke it. */
    const tokens = generateTokens(user);
    await prisma.$transaction([
      prisma.session.delete({ where: { id: session.id } }),
      prisma.session.create({
        data: {
          userId: user.id,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    res.json({ success: true, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        mustChangePassword: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

/**
 * Sign out — revokes the refresh token server-side.
 *
 * Clearing localStorage alone leaves the refresh token valid, so a captured
 * one still works after the user believes they have signed out.
 */
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body ?? {};
    if (refreshToken) {
      await prisma.session.deleteMany({ where: { refreshToken } });
    }
    res.json({ success: true, message: 'Signed out.' });
  } catch (error) {
    next(error);
  }
});

/** Revoke every session for the current user — "sign out everywhere". */
router.post('/logout-all', authenticate, async (req, res, next) => {
  try {
    await prisma.session.deleteMany({ where: { userId: (req as any).user.id } });
    res.json({ success: true, message: 'Signed out on all devices.' });
  } catch (error) {
    next(error);
  }
});

export default router;
