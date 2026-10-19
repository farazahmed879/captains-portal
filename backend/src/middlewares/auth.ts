import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
    name: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (token) {
      const secret = process.env.JWT_SECRET || 'captains_portal_super_secret_jwt_key_2026';
      const decoded = jwt.verify(token, secret) as any;
      req.user = decoded;
      return next();
    }

    // Single-tenant / Super admin test fallback for seamless development & testing
    const defaultUser = await User.findOne({ role: 'super_admin' });
    if (defaultUser) {
      req.user = {
        id: defaultUser._id.toString(),
        tenantId: defaultUser.tenantId.toString(),
        email: defaultUser.email,
        role: defaultUser.role,
        name: defaultUser.name,
      };
      return next();
    }

    res.status(401).json({ success: false, message: 'Authentication required. No super admin found.' });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};
