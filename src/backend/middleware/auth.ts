import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase-admin/firestore';
import { AuthSystem, SessionToken, AuthResult } from '../../types/backend';
import config from '../config';
import firebaseService from '../database/firebase';
// import blockchainService from '../services/blockchain';

// Extend Express Request interface to include user data
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

class AuthService implements AuthSystem {
  private readonly JWT_ALGORITHM = 'HS256';
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly DEFAULT_PERMISSIONS = ['read', 'write', 'discover'];

  async createAnonymousSession(): Promise<SessionToken> {
    try {
      const userId = `anon_${uuidv4()}`;
      const expiresAt = Timestamp.fromMillis(Date.now() + this.SESSION_DURATION);

      // Create JWT token
      const tokenPayload = {
        userId,
        type: 'anonymous',
        permissions: this.DEFAULT_PERMISSIONS,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(expiresAt.toMillis() / 1000),
      };

      const token = jwt.sign(tokenPayload, config.security.jwtSecret, {
        algorithm: this.JWT_ALGORITHM,
      });

      // Create user profile in Firebase
      await firebaseService.createUser(userId, {
        isOnboarded: false,
        privacyLevel: 'balanced',
        locationSharingEnabled: false,
      });

      return {
        token,
        userId,
        expiresAt,
        permissions: this.DEFAULT_PERMISSIONS,
      };
    } catch (error) {
      console.error('Failed to create anonymous session:', error);
      throw new Error('Session creation failed');
    }
  }

  async authenticateWithDID(didId: string, signature: string): Promise<AuthResult> {
    try {
      // Resolve DID to get user information
      // const didResolution = await blockchainService.resolveDID(didId);
    const didResolution = null; // Blockchain disabled for now
      
      if (!didResolution) {
        return {
          success: false,
          error: 'Invalid DID or DID not found',
        };
      }

      // Verify signature (simplified - in production would verify cryptographic signature)
      const isValidSignature = await this.verifyDIDSignature(didId, signature);
      
      if (!isValidSignature) {
        return {
          success: false,
          error: 'Invalid signature',
        };
      }

      // Create session for DID-authenticated user
      const userId = `did_${didId.split(':').pop()}`;
      const expiresAt = Timestamp.fromMillis(Date.now() + this.SESSION_DURATION);

      const tokenPayload = {
        userId,
        didId,
        type: 'did',
        permissions: [...this.DEFAULT_PERMISSIONS, 'blockchain'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(expiresAt.toMillis() / 1000),
      };

      const token = jwt.sign(tokenPayload, config.security.jwtSecret, {
        algorithm: this.JWT_ALGORITHM,
      });

      const sessionToken: SessionToken = {
        token,
        userId,
        expiresAt,
        permissions: [...this.DEFAULT_PERMISSIONS, 'blockchain'],
      };

      return {
        success: true,
        sessionToken,
      };
    } catch (error) {
      console.error('DID authentication failed:', error);
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  async verifyPermissions(userId: string, resource: string): Promise<boolean> {
    try {
      const userProfile = await firebaseService.getUserProfile(userId);
      
      if (!userProfile) {
        return false;
      }

      // Basic permission check (can be expanded based on requirements)
      const restrictedResources = ['admin', 'system'];
      
      if (restrictedResources.includes(resource) && userProfile.privacyLevel === 'strict') {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Permission verification failed:', error);
      return false;
    }
  }

  async refreshSession(token: SessionToken): Promise<SessionToken> {
    try {
      // Verify current token
      const decoded = jwt.verify(token.token, config.security.jwtSecret) as any;
      
      if (!decoded || !decoded.userId) {
        throw new Error('Invalid token');
      }

      // Create new token with extended expiry
      const expiresAt = Timestamp.fromMillis(Date.now() + this.SESSION_DURATION);
      
      const newTokenPayload = {
        ...decoded,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(expiresAt.toMillis() / 1000),
      };

      const newToken = jwt.sign(newTokenPayload, config.security.jwtSecret, {
        algorithm: this.JWT_ALGORITHM,
      });

      return {
        token: newToken,
        userId: decoded.userId,
        expiresAt,
        permissions: decoded.permissions || this.DEFAULT_PERMISSIONS,
      };
    } catch (error) {
      console.error('Session refresh failed:', error);
      throw new Error('Session refresh failed');
    }
  }

  private async verifyDIDSignature(didId: string, signature: string): Promise<boolean> {
    // Simplified signature verification
    // In production, this would involve cryptographic verification
    // using the public key associated with the DID
    return signature.length > 10 && didId.startsWith('did:xrpl:');
  }
}

// Create auth service instance
export const authService = new AuthService();

// ============================================================================
// Middleware Functions
// ============================================================================

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Add request ID for tracking
    req.requestId = uuidv4();

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
        requestId: req.requestId,
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, config.security.jwtSecret) as any;
    
    if (!decoded || !decoded.userId) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        requestId: req.requestId,
      });
      return;
    }

    // Check if token is expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        requestId: req.requestId,
      });
      return;
    }

    // Verify user exists
    const userProfile = await firebaseService.getUserProfile(decoded.userId);
    
    if (!userProfile) {
      res.status(401).json({
        success: false,
        error: 'User not found',
        requestId: req.requestId,
      });
      return;
    }

    // Set user data in request
    req.user = {
      userId: decoded.userId,
      sessionToken: token,
      permissions: decoded.permissions || authService['DEFAULT_PERMISSIONS'],
      isAnonymous: decoded.type === 'anonymous',
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      requestId: req.requestId,
    });
  }
};

export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Add request ID
    req.requestId = uuidv4();

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth provided, continue without user data
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.security.jwtSecret) as any;
      
      if (decoded && decoded.userId) {
        req.user = {
          userId: decoded.userId,
          sessionToken: token,
          permissions: decoded.permissions || authService['DEFAULT_PERMISSIONS'],
          isAnonymous: decoded.type === 'anonymous',
        };
      }
    } catch (error) {
      // Invalid token, but continue without auth
      console.warn('Invalid token in optional auth:', error instanceof Error ? error.message : String(error));
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue even if optional auth fails
  }
};

export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          requestId: req.requestId,
        });
        return;
      }

      if (!req.user.permissions.includes(permission)) {
        res.status(403).json({
          success: false,
          error: `Permission '${permission}' required`,
          requestId: req.requestId,
        });
        return;
      }

      // Verify permission with auth service
      const hasPermission = await authService.verifyPermissions(req.user.userId, permission);
      
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          requestId: req.requestId,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Permission verification failed',
        requestId: req.requestId,
      });
    }
  };
};

export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  const userLimits = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.user?.userId || req.ip;
    const now = Date.now();

    // Clean up expired entries
    for (const [key, data] of userLimits.entries()) {
      if (now > data.resetTime) {
        userLimits.delete(key);
      }
    }

    // Check current user's limit
    const userLimit = userLimits.get(userId);
    
    if (!userLimit) {
      userLimits.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (userLimit.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        requestId: req.requestId,
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
      });
      return;
    }

    userLimit.count++;
    next();
  };
};

export default authService; 