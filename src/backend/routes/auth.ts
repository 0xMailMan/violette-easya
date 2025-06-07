import { Router } from 'express';
import { authService, authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { APIResponse } from '../../types/backend';

const router = Router();

// POST /api/auth/anonymous - Create anonymous session
router.post('/anonymous', asyncHandler(async (req, res) => {
  try {
    const sessionToken = await authService.createAnonymousSession();

    const response: APIResponse = {
      success: true,
      data: sessionToken,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || 'unknown',
    };

    res.status(201).json(response);
  } catch (error) {
    throw new Error(`Anonymous session creation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}));

// POST /api/auth/did - Authenticate with DID
router.post('/did', asyncHandler(async (req, res) => {
  const { didId, signature } = req.body;

  if (!didId || !signature) {
    const response: APIResponse = {
      success: false,
      error: 'DID ID and signature are required',
      timestamp: new Date().toISOString(),
      requestId: req.requestId || 'unknown',
    };
    res.status(400).json(response);
    return;
  }

  try {
    const authResult = await authService.authenticateWithDID(didId, signature);

    const response: APIResponse = {
      success: authResult.success,
      data: authResult.sessionToken,
      error: authResult.error,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || 'unknown',
    };

    if (authResult.success) {
      res.status(200).json(response);
    } else {
      res.status(401).json(response);
    }
  } catch (error) {
    throw new Error(`DID authentication failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}));

// POST /api/auth/refresh - Refresh session token
router.post('/refresh', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) {
    const response: APIResponse = {
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
      expiresAt: null as any, // Will be set by refresh method
      permissions: req.user.permissions,
    };

    const newSessionToken = await authService.refreshSession(currentToken);

    const response: APIResponse = {
      success: true,
      data: newSessionToken,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || 'unknown',
    };

    res.status(200).json(response);
  } catch (error) {
    throw new Error(`Session refresh failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}));

// GET /api/auth/verify - Verify current session
router.get('/verify', authMiddleware, asyncHandler(async (req, res) => {
  const response: APIResponse = {
    success: true,
    data: {
      userId: req.user!.userId,
      permissions: req.user!.permissions,
      isAnonymous: req.user!.isAnonymous,
      isValid: true,
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId || 'unknown',
  };

  res.status(200).json(response);
}));

export { router as authRoutes }; 