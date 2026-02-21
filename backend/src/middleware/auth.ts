import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

// Stub implementation - replace with next-auth middleware when configured
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // For now, check x-user-id header for API requests
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    req.user = {
      id: userId,
      email: req.headers['x-user-email'] as string || '',
      name: req.headers['x-user-name'] as string,
    };
  }
  next();
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    req.user = {
      id: userId,
      email: req.headers['x-user-email'] as string || '',
      name: req.headers['x-user-name'] as string,
    };
  }
  next();
};

export const requireRole = (...roles: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userRole = (req.headers['x-user-role'] as string) || 'MEMBER';
    
    if (!roles.includes(userRole)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };
};
