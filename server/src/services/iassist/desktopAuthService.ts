import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';

function generateTokens(user: { id: string; email: string; role: string }) {
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
}

export const desktopAuthService = {
  async generateCode(userId: string, state: string): Promise<string> {
    const code = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.desktopAuthCode.create({
      data: { code, state, userId, expiresAt },
    });

    return code;
  },

  async exchangeCode(code: string, state: string) {
    const authCode = await prisma.desktopAuthCode.findUnique({ where: { code } });

    if (!authCode || authCode.used || authCode.expiresAt < new Date()) {
      throw new AppError('Invalid or expired authorization code', 401);
    }

    if (authCode.state !== state) {
      throw new AppError('State mismatch', 401);
    }

    await prisma.desktopAuthCode.update({
      where: { id: authCode.id },
      data: { used: true },
    });

    const user = await prisma.user.findUnique({ where: { id: authCode.userId } });
    if (!user) throw new AppError('User not found', 404);

    const tokens = generateTokens(user);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: 'NxtGen Desktop',
      },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
        role: user.role,
      },
    };
  },

  async cleanupExpired() {
    await prisma.desktopAuthCode.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },
};
