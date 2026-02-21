import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class MemoryRateLimitStore {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const resetTime = now + windowMs;

    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = { count: 1, resetTime };
    } else {
      this.store[key].count++;
    }

    return this.store[key];
  }

  get(key: string): { count: number; resetTime: number } | null {
    return this.store[key] || null;
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

const store = new MemoryRateLimitStore();

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req: Request) => {
      return req.headers['x-user-id'] as string || req.ip || 'unknown';
    },
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const { count, resetTime } = store.increment(key, windowMs);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));
    res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());

    if (count > maxRequests) {
      res.status(429).json({
        error: {
          message,
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        },
      });
      return;
    }

    next();
  };
};

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 100,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many authentication attempts, please try again later.',
});

export const messageRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Too many messages, please slow down.',
});

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: 'Too many uploads, please try again later.',
});
