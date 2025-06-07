"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const error_handler_1 = require("../middleware/error-handler");
const router = (0, express_1.Router)();
exports.authRoutes = router;
// POST /api/auth/anonymous - Create anonymous session
router.post('/anonymous', (0, error_handler_1.asyncHandler)(async (req, res) => {
    try {
        const sessionToken = await auth_1.authService.createAnonymousSession();
        const response = {
            success: true,
            data: sessionToken,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || 'unknown',
        };
        res.status(201).json(response);
    }
    catch (error) {
        throw new Error(`Anonymous session creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}));
// POST /api/auth/did - Authenticate with DID
router.post('/did', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { didId, signature } = req.body;
    if (!didId || !signature) {
        const response = {
            success: false,
            error: 'DID ID and signature are required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId || 'unknown',
        };
        res.status(400).json(response);
        return;
    }
    try {
        const authResult = await auth_1.authService.authenticateWithDID(didId, signature);
        const response = {
            success: authResult.success,
            data: authResult.sessionToken,
            error: authResult.error,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || 'unknown',
        };
        if (authResult.success) {
            res.status(200).json(response);
        }
        else {
            res.status(401).json(response);
        }
    }
    catch (error) {
        throw new Error(`DID authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}));
// POST /api/auth/refresh - Refresh session token
router.post('/refresh', auth_1.authMiddleware, (0, error_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        const response = {
            success: false,
            error: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId || 'unknown',
        };
        res.status(401).json(response);
        return;
    }
    try {
        const currentToken = {
            token: req.user.sessionToken,
            userId: req.user.userId,
            expiresAt: null, // Will be set by refresh method
            permissions: req.user.permissions,
        };
        const newSessionToken = await auth_1.authService.refreshSession(currentToken);
        const response = {
            success: true,
            data: newSessionToken,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || 'unknown',
        };
        res.status(200).json(response);
    }
    catch (error) {
        throw new Error(`Session refresh failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}));
// GET /api/auth/verify - Verify current session
router.get('/verify', auth_1.authMiddleware, (0, error_handler_1.asyncHandler)(async (req, res) => {
    const response = {
        success: true,
        data: {
            userId: req.user.userId,
            permissions: req.user.permissions,
            isAnonymous: req.user.isAnonymous,
            isValid: true,
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId || 'unknown',
    };
    res.status(200).json(response);
}));
//# sourceMappingURL=auth.js.map