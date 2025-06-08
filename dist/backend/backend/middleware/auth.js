"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitByUser = exports.requirePermission = exports.optionalAuthMiddleware = exports.authMiddleware = exports.authService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const firestore_1 = require("firebase-admin/firestore");
const config_1 = __importDefault(require("../config"));
const firebase_1 = __importDefault(require("../database/firebase"));
class AuthService {
    constructor() {
        this.JWT_ALGORITHM = 'HS256';
        this.SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
        this.DEFAULT_PERMISSIONS = ['read', 'write', 'discover', 'blockchain'];
    }
    async createAnonymousSession() {
        try {
            const userId = `anon_${(0, uuid_1.v4)()}`;
            const expiresAt = firestore_1.Timestamp.fromMillis(Date.now() + this.SESSION_DURATION);
            // Create JWT token
            const tokenPayload = {
                userId,
                type: 'anonymous',
                permissions: this.DEFAULT_PERMISSIONS,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(expiresAt.toMillis() / 1000),
            };
            const token = jsonwebtoken_1.default.sign(tokenPayload, config_1.default.security.jwtSecret, {
                algorithm: this.JWT_ALGORITHM,
            });
            // Create user profile in Firebase
            await firebase_1.default.createUser(userId, {
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
        }
        catch (error) {
            console.error('Failed to create anonymous session:', error);
            throw new Error('Session creation failed');
        }
    }
    async authenticateWithDID(didId, signature) {
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
            const expiresAt = firestore_1.Timestamp.fromMillis(Date.now() + this.SESSION_DURATION);
            const tokenPayload = {
                userId,
                didId,
                type: 'did',
                permissions: [...this.DEFAULT_PERMISSIONS, 'blockchain'],
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(expiresAt.toMillis() / 1000),
            };
            const token = jsonwebtoken_1.default.sign(tokenPayload, config_1.default.security.jwtSecret, {
                algorithm: this.JWT_ALGORITHM,
            });
            const sessionToken = {
                token,
                userId,
                expiresAt,
                permissions: [...this.DEFAULT_PERMISSIONS, 'blockchain'],
            };
            return {
                success: true,
                sessionToken,
            };
        }
        catch (error) {
            console.error('DID authentication failed:', error);
            return {
                success: false,
                error: 'Authentication failed',
            };
        }
    }
    async verifyPermissions(userId, resource) {
        try {
            const userProfile = await firebase_1.default.getUserProfile(userId);
            if (!userProfile) {
                return false;
            }
            // Basic permission check (can be expanded based on requirements)
            const restrictedResources = ['admin', 'system'];
            if (restrictedResources.includes(resource) && userProfile.privacyLevel === 'strict') {
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Permission verification failed:', error);
            return false;
        }
    }
    async refreshSession(token) {
        try {
            // Verify current token
            const decoded = jsonwebtoken_1.default.verify(token.token, config_1.default.security.jwtSecret);
            if (!decoded || !decoded.userId) {
                throw new Error('Invalid token');
            }
            // Create new token with extended expiry
            const expiresAt = firestore_1.Timestamp.fromMillis(Date.now() + this.SESSION_DURATION);
            const newTokenPayload = {
                ...decoded,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(expiresAt.toMillis() / 1000),
            };
            const newToken = jsonwebtoken_1.default.sign(newTokenPayload, config_1.default.security.jwtSecret, {
                algorithm: this.JWT_ALGORITHM,
            });
            return {
                token: newToken,
                userId: decoded.userId,
                expiresAt,
                permissions: decoded.permissions || this.DEFAULT_PERMISSIONS,
            };
        }
        catch (error) {
            console.error('Session refresh failed:', error);
            throw new Error('Session refresh failed');
        }
    }
    async verifyDIDSignature(didId, signature) {
        // Simplified signature verification
        // In production, this would involve cryptographic verification
        // using the public key associated with the DID
        return signature.length > 10 && didId.startsWith('did:xrpl:');
    }
}
// Create auth service instance
exports.authService = new AuthService();
// ============================================================================
// Middleware Functions
// ============================================================================
const authMiddleware = async (req, res, next) => {
    try {
        // Add request ID for tracking
        req.requestId = (0, uuid_1.v4)();
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
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.security.jwtSecret);
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
        const userProfile = await firebase_1.default.getUserProfile(decoded.userId);
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
            permissions: decoded.permissions || exports.authService['DEFAULT_PERMISSIONS'],
            isAnonymous: decoded.type === 'anonymous',
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            error: 'Authentication failed',
            requestId: req.requestId,
        });
    }
};
exports.authMiddleware = authMiddleware;
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        // Add request ID
        req.requestId = (0, uuid_1.v4)();
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No auth provided, continue without user data
            next();
            return;
        }
        const token = authHeader.substring(7);
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.security.jwtSecret);
            if (decoded && decoded.userId) {
                req.user = {
                    userId: decoded.userId,
                    sessionToken: token,
                    permissions: decoded.permissions || exports.authService['DEFAULT_PERMISSIONS'],
                    isAnonymous: decoded.type === 'anonymous',
                };
            }
        }
        catch (error) {
            // Invalid token, but continue without auth
            console.warn('Invalid token in optional auth:', error instanceof Error ? error.message : String(error));
        }
        next();
    }
    catch (error) {
        console.error('Optional auth error:', error);
        next(); // Continue even if optional auth fails
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const requirePermission = (permission) => {
    return async (req, res, next) => {
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
            const hasPermission = await exports.authService.verifyPermissions(req.user.userId, permission);
            if (!hasPermission) {
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                    requestId: req.requestId,
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                error: 'Permission verification failed',
                requestId: req.requestId,
            });
        }
    };
};
exports.requirePermission = requirePermission;
const rateLimitByUser = (maxRequests, windowMs) => {
    const userLimits = new Map();
    return (req, res, next) => {
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
exports.rateLimitByUser = rateLimitByUser;
exports.default = exports.authService;
//# sourceMappingURL=auth.js.map