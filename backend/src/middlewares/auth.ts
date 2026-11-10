import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { getJwtSecret } from '../config/jwt';
import { UserRole } from '../enums';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
    name: string;
    phone?: string;
    playerId?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    return;
  }

  try {
    // Re-read the user so role changes and deactivations take effect immediately,
    // rather than only when the (30-day) token expires.
    if (!decoded?.id || !mongoose.isValidObjectId(decoded.id)) {
      res.status(401).json({ success: false, message: 'Invalid or expired token.' });
      return;
    }
    const user = await User.findById(decoded.id).select('tenantId email role name phone playerId isActive');
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Account not found or suspended.' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      tenantId: user.tenantId.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone || undefined,
      playerId: user.playerId ? user.playerId.toString() : undefined,
    };
    next();
  } catch (error) {
    next(error);
  }
};

const ADMIN_ROLES: string[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
const WRITE_ROLES: string[] = [...ADMIN_ROLES, UserRole.CAPTAIN, UserRole.TREASURER];

export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
    res.status(403).json({ success: false, message: 'Admin authorization required.' });
    return;
  }
  next();
};

/**
 * Lets every authenticated role read (GET/HEAD/OPTIONS) but limits
 * create/update/delete to captains, treasurers and admins. Viewers are read-only.
 */
export const requireWriteAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }
  if (!req.user || !WRITE_ROLES.includes(req.user.role)) {
    res.status(403).json({ success: false, message: 'You have read-only access.' });
    return;
  }
  next();
};
