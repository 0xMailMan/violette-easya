"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const error_handler_1 = require("../middleware/error-handler");
const firebase_1 = __importDefault(require("../database/firebase"));
const router = (0, express_1.Router)();
exports.userRoutes = router;
// All user routes require authentication
router.use(auth_1.authMiddleware);
// GET /api/users/profile - Get user profile
router.get('/profile', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const userProfile = await firebase_1.default.getUserProfile(req.user.userId);
    if (!userProfile) {
        const response = {
            success: false,
            error: 'User profile not found',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(404).json(response);
        return;
    }
    const response = {
        success: true,
        data: userProfile,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
// PUT /api/users/profile - Update user profile
router.put('/profile', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { privacyLevel, locationSharingEnabled, isOnboarded } = req.body;
    const updates = {};
    if (privacyLevel !== undefined)
        updates.privacyLevel = privacyLevel;
    if (locationSharingEnabled !== undefined)
        updates.locationSharingEnabled = locationSharingEnabled;
    if (isOnboarded !== undefined)
        updates.isOnboarded = isOnboarded;
    await firebase_1.default.updateUserProfile(req.user.userId, updates);
    const response = {
        success: true,
        data: { message: 'Profile updated successfully' },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
// GET /api/users/settings - Get user settings
router.get('/settings', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const userSettings = await firebase_1.default.getUserSettings(req.user.userId);
    const response = {
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
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
// PUT /api/users/settings - Update user settings
router.put('/settings', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const settings = req.body;
    await firebase_1.default.updateUserSettings(req.user.userId, settings);
    const response = {
        success: true,
        data: { message: 'Settings updated successfully' },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
// GET /api/users/analytics - Get user analytics
router.get('/analytics', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const analytics = await firebase_1.default.getUserAnalytics(req.user.userId);
    const response = {
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
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
//# sourceMappingURL=users.js.map