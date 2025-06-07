import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { APIResponse } from '../../types/backend';
import firebaseService from '../database/firebase';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// GET /api/users/profile - Get user profile
router.get('/profile', asyncHandler(async (req, res) => {
  const userProfile = await firebaseService.getUserProfile(req.user!.userId);

  if (!userProfile) {
    const response: APIResponse = {
      success: false,
      error: 'User profile not found',
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };
    res.status(404).json(response);
    return;
  }

  const response: APIResponse = {
    success: true,
    data: userProfile,
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

// PUT /api/users/profile - Update user profile
router.put('/profile', asyncHandler(async (req, res) => {
  const { privacyLevel, locationSharingEnabled, isOnboarded } = req.body;

  const updates: any = {};
  if (privacyLevel !== undefined) updates.privacyLevel = privacyLevel;
  if (locationSharingEnabled !== undefined) updates.locationSharingEnabled = locationSharingEnabled;
  if (isOnboarded !== undefined) updates.isOnboarded = isOnboarded;

  await firebaseService.updateUserProfile(req.user!.userId, updates);

  const response: APIResponse = {
    success: true,
    data: { message: 'Profile updated successfully' },
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

// GET /api/users/settings - Get user settings
router.get('/settings', asyncHandler(async (req, res) => {
  const userSettings = await firebaseService.getUserSettings(req.user!.userId);

  const response: APIResponse = {
    success: true,
    data: userSettings || {
      notifications: {
        discoveries: true,
        recommendations: true,
        systemUpdates: false,
      },
      privacy: {
        shareLocation: false,
        shareTimestamps: false,
        anonymousMode: true,
      },
      ai: {
        detailLevel: 'standard',
        includeEmotions: true,
        languagePreference: 'en',
      },
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

// PUT /api/users/settings - Update user settings
router.put('/settings', asyncHandler(async (req, res) => {
  const settings = req.body;

  await firebaseService.updateUserSettings(req.user!.userId, settings);

  const response: APIResponse = {
    success: true,
    data: { message: 'Settings updated successfully' },
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

// GET /api/users/analytics - Get user analytics
router.get('/analytics', asyncHandler(async (req, res) => {
  const analytics = await firebaseService.getUserAnalytics(req.user!.userId);

  const response: APIResponse = {
    success: true,
    data: analytics || {
      totalEntries: 0,
      averageEntriesPerWeek: 0,
      topThemes: [],
      locationClusters: 0,
      discoveryScore: 0,
      lastAnalysisUpdate: new Date(),
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

export { router as userRoutes }; 