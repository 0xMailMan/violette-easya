import { Request, Response, NextFunction } from 'express';
import { AuthSystem, SessionToken, AuthResult } from '../../types/backend';
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                sessionToken: string;
                permissions: string[];
                isAnonymous: boolean;
            };
            requestId?: string;
        }
    }
}
declare class AuthService implements AuthSystem {
    private readonly JWT_ALGORITHM;
    private readonly SESSION_DURATION;
    private readonly DEFAULT_PERMISSIONS;
    createAnonymousSession(): Promise<SessionToken>;
    authenticateWithDID(didId: string, signature: string): Promise<AuthResult>;
    verifyPermissions(userId: string, resource: string): Promise<boolean>;
    refreshSession(token: SessionToken): Promise<SessionToken>;
    private verifyDIDSignature;
}
export declare const authService: AuthService;
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuthMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requirePermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const rateLimitByUser: (maxRequests: number, windowMs: number) => (req: Request, res: Response, next: NextFunction) => void;
export default authService;
//# sourceMappingURL=auth.d.ts.map