import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from './errorHandler';

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
 * Attaches req.user when a valid token is present, but never rejects.
 *
 * For endpoints that serve both signed-in members and guests — the caller
 * decides what to do differently, rather than the request being turned away.
 */
export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], env.JWT_SECRET) as JwtPayload;
    } catch {
      // An expired or bogus token is treated as "not signed in".
    }
  }
  next();
};

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError('Unauthorized', 401));
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
