import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'verimeasure-super-secret-key-2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'OWNER' | 'LMO' | 'GATC_OPERATOR' | 'STATE_ADMIN' | 'CENTRAL_ADMIN';
    organization_id?: string;
    jurisdiction_state?: string;
    jurisdiction_district?: string;
    verification_scope?: string[];
  };
}

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

export function requireRole(allowedRoles: Array<'OWNER' | 'LMO' | 'GATC_OPERATOR' | 'STATE_ADMIN' | 'CENTRAL_ADMIN'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Access restricted to roles: ${allowedRoles.join(', ')}` });
    }
    next();
  };
}

export function generateToken(user: any) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id,
      jurisdiction_state: user.jurisdiction_state,
      jurisdiction_district: user.jurisdiction_district,
      verification_scope: user.verification_scope ? JSON.parse(typeof user.verification_scope === 'string' ? user.verification_scope : JSON.stringify(user.verification_scope)) : []
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}
