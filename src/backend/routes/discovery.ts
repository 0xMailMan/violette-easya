import { Router } from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { APIResponse } from '../../types/backend';
import discoveryEngineService from '../services/discovery-engine';
import { Timestamp } from 'firebase-admin/firestore';

const router = Router();

// All discovery routes require authentication
router.use(authMiddleware);
router.use(requirePermission('discover'));

// GET /api/discovery/similar-users - Find similar users
router.get('/similar-users', asyncHandler(async (req, res) => {
  const { embeddings, locationHistory, timeWindow, maxResults = 10 } = req.query;

  if (!embeddings) {
    const response: APIResponse = {
      success: false,
      error: 'User embeddings are required',
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };
    res.status(400).json(response);
    return;
  }

  // Parse query parameters
  const userEmbeddings = JSON.parse(embeddings as string);
  const locations = locationHistory ? JSON.parse(locationHistory as string) : [];
  const window = timeWindow ? {
    start: Timestamp.fromMillis(parseInt((timeWindow as any).start)),
    end: Timestamp.fromMillis(parseInt((timeWindow as any).end))
  } : {
    start: Timestamp.fromMillis(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: Timestamp.now()
  };

  const similarUsers = await discoveryEngineService.findSimilarUsers({
    userEmbeddings,
    locationHistory: locations,
    timeWindow: window,
    maxResults: parseInt(maxResults as string),
  });

  const response: APIResponse = {
    success: true,
    data: {
      similarUsers,
      count: similarUsers.length,
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

// GET /api/discovery/recommendations - Get recommendations
router.get('/recommendations', asyncHandler(async (req, res) => {
  const { similarUsers, excludeVisited = 'true' } = req.query;

  if (!similarUsers) {
    const response: APIResponse = {
      success: false,
      error: 'Similar users data is required',
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };
    res.status(400).json(response);
    return;
  }

  const parsedSimilarUsers = JSON.parse(similarUsers as string);
  const shouldExcludeVisited = excludeVisited === 'true';

  const recommendations = await discoveryEngineService.generateRecommendations({
    userId: req.user!.userId,
    similarUsers: parsedSimilarUsers,
    excludeVisited: shouldExcludeVisited,
  });

  const response: APIResponse = {
    success: true,
    data: {
      recommendations,
      count: recommendations.length,
      generatedAt: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

// POST /api/discovery/update-clusters - Update user clusters
router.post('/update-clusters', asyncHandler(async (req, res) => {
  // This is an admin operation that updates the clustering algorithm
  const result = await discoveryEngineService.updateUserClusters();

  const response: APIResponse = {
    success: true,
    data: result,
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

// POST /api/discovery/calculate-score - Calculate discovery score between users
router.post('/calculate-score', asyncHandler(async (req, res) => {
  const { userAId, userBId } = req.body;

  if (!userAId || !userBId) {
    const response: APIResponse = {
      success: false,
      error: 'Both user IDs are required',
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };
    res.status(400).json(response);
    return;
  }

  // Create minimal user profiles for calculation
  const userA = { id: userAId } as any;
  const userB = { id: userBId } as any;

  const discoveryScore = await discoveryEngineService.calculateDiscoveryScore(userA, userB);

  const response: APIResponse = {
    success: true,
    data: {
      userAId,
      userBId,
      discoveryScore,
      calculatedAt: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

export { router as discoveryRoutes }; 