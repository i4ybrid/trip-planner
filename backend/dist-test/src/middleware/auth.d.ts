import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    userId: string;
    email: string;
}
export interface AuthRequest extends Request {
    user?: JwtPayload;
}
export declare const JWT_SECRET: string;
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void;
export declare function generateToken(payload: JwtPayload): string;
//# sourceMappingURL=auth.d.ts.map