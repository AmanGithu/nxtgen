import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, UserStatus } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from './errorHandler';
import { prisma } from '../lib/prisma';

export { UserRole };

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Alias used by the ported resume controllers. `Request` already carries an
 * optional `user` via the global augmentation above, so this is purely a
 * readability marker for handlers that require authentication.
 */
export type AuthRequest = Request;

/**
 * Current role and status, cached briefly.
 *
 * The token carries a role, but tokens live for days: trusting it means a
 * suspended account keeps working and a demoted user keeps their privileges
 * until the token happens to expire. Reading the row makes both take effect
 * immediately. The short cache keeps that from becoming a database round-trip
 * on every single request.
 */
const CACHE_MS = 15_000;
const cache = new Map<string, { role: UserRole; status: UserStatus; at: number }>();

async function currentUser(id: string) {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit;

  const row = await prisma.user.findUnique({
    where: { id },
    select: { role: true, status: true },
  });
  if (!row) return null;

  const entry = { ...row, at: Date.now() };
  cache.set(id, entry);
  return entry;
}

/** Drop a user's cached role/status so a change applies on the next request. */
export const invalidateUserCache = (id: string) => cache.delete(id);

/**
 * Attaches req.user when a valid token is present, but never rejects.
 *
 * For endpoints that serve both signed-in members and guests — the caller
 * decides what to do differently, rather than the request being turned away.
 */
export const optionalAuthenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], env.JWT_SECRET) as JwtPayload;
      const live = await currentUser(decoded.id);
      // A suspended account is treated as signed out here rather than refused,
      // since these endpoints serve guests anyway.
      if (live && live.status === UserStatus.ACTIVE) {
        req.user = { ...decoded, role: live.role };
      }
    } catch {
      // An expired or bogus token is treated as "not signed in".
    }
  }
  next();
};

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const live = await currentUser(decoded.id);
    if (!live) throw new AppError('Unauthorized', 401);
    if (live.status !== UserStatus.ACTIVE) {
      throw new AppError('This account has been suspended.', 403);
    }

    // Role comes from the row, not the token, so promotions and demotions
    // take effect at once instead of waiting out the token's lifetime.
    req.user = { ...decoded, role: live.role };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Unauthorized', 401));
  }
};

export const authorize = (...roles: (UserRole | string)[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403));
    }
    next();
  };
};
