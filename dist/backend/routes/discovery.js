"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoveryRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const error_handler_1 = require("../middleware/error-handler");
const discovery_engine_1 = __importDefault(require("../services/discovery-engine"));
const firestore_1 = require("firebase-admin/firestore");
const router = (0, express_1.Router)();
exports.discoveryRoutes = router;
// All discovery routes require authentication
router.use(auth_1.authMiddleware);
router.use((0, auth_1.requirePermission)('discover'));
// GET /api/discovery/similar-users - Find similar users
router.get('/similar-users', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { embeddings, locationHistory, timeWindow, maxResults = 10 } = req.query;
    if (!embeddings) {
        const response = {
            success: false,
            error: 'User embeddings are required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(400).json(response);
        return;
    }
    // Parse query parameters
    const userEmbeddings = JSON.parse(embeddings);
    const locations = locationHistory ? JSON.parse(locationHistory) : [];
    const window = timeWindow ? {
        start: firestore_1.Timestamp.fromMillis(parseInt(timeWindow.start)),
        end: firestore_1.Timestamp.fromMillis(parseInt(timeWindow.end))
    } : {
        start: firestore_1.Timestamp.fromMillis(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: firestore_1.Timestamp.now()
    };
    const similarUsers = await discovery_engine_1.default.findSimilarUsers({
        userEmbeddings,
        locationHistory: locations,
        timeWindow: window,
        maxResults: parseInt(maxResults),
    });
    const response = {
        success: true,
        data: {
            similarUsers,
            count: similarUsers.length,
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
// GET /api/discovery/recommendations - Get recommendations
router.get('/recommendations', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { similarUsers, excludeVisited = 'true' } = req.query;
    if (!similarUsers) {
        const response = {
            success: false,
            error: 'Similar users data is required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(400).json(response);
        return;
    }
    const parsedSimilarUsers = JSON.parse(similarUsers);
    const shouldExcludeVisited = excludeVisited === 'true';
    const recommendations = await discovery_engine_1.default.generateRecommendations({
        userId: req.user.userId,
        similarUsers: parsedSimilarUsers,
        excludeVisited: shouldExcludeVisited,
    });
    const response = {
        success: true,
        data: {
            recommendations,
            count: recommendations.length,
            generatedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
// POST /api/discovery/update-clusters - Update user clusters
router.post('/update-clusters', (0, error_handler_1.asyncHandler)(async (req, res) => {
    // This is an admin operation that updates the clustering algorithm
    const result = await discovery_engine_1.default.updateUserClusters();
    const response = {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
// POST /api/discovery/calculate-score - Calculate discovery score between users
router.post('/calculate-score', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { userAId, userBId } = req.body;
    if (!userAId || !userBId) {
        const response = {
            success: false,
            error: 'Both user IDs are required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(400).json(response);
        return;
    }
    // Create minimal user profiles for calculation
    const userA = { id: userAId };
    const userB = { id: userBId };
    const discoveryScore = await discovery_engine_1.default.calculateDiscoveryScore(userA, userB);
    const response = {
        success: true,
        data: {
            userAId,
            userBId,
            discoveryScore,
            calculatedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
//# sourceMappingURL=discovery.js.map