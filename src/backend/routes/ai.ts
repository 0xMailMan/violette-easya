import { Router } from 'express';
import { authMiddleware, rateLimitByUser } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { APIResponse } from '../../types/backend';
import aiProcessingService from '../services/ai-processing';

const router = Router();

// All AI routes require authentication and rate limiting
router.use(authMiddleware);
router.use(rateLimitByUser(10, 60000)); // 10 requests per minute

// POST /api/ai/analyze - Analyze content with AI
router.post('/analyze', asyncHandler(async (req, res) => {
  const { photo, text, location } = req.body;

  if (!photo && !text) {
    const response: APIResponse = {
      success: false,
      error: 'Either photo or text content is required',
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };
    res.status(400).json(response);
    return;
  }

  // Validate photo if provided
  if (photo) {
    const isValidImage = await aiProcessingService.validateImageContent(photo);
    if (!isValidImage) {
      const response: APIResponse = {
        success: false,
        error: 'Invalid image format or size',
        timestamp: new Date().toISOString(),
        requestId: req.requestId!,
      };
      res.status(400).json(response);
      return;
    }
  }

  const analysis = await aiProcessingService.analyzeContent({
    photo,
    text,
    location,
  });

  const response: APIResponse = {
    success: true,
    data: analysis,
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

// POST /api/ai/generate-embedding - Generate embedding vector
router.post('/generate-embedding', asyncHandler(async (req, res) => {
  const { description } = req.body;

  if (!description || typeof description !== 'string') {
    const response: APIResponse = {
      success: false,
      error: 'Description text is required',
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };
    res.status(400).json(response);
    return;
  }

  const embedding = await aiProcessingService.generateEmbedding(description);

  const response: APIResponse = {
    success: true,
    data: {
      embedding,
      dimensions: embedding.length,
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

// POST /api/ai/extract-themes - Extract themes from content
router.post('/extract-themes', asyncHandler(async (req, res) => {
  const { description } = req.body;

  if (!description || typeof description !== 'string') {
    const response: APIResponse = {
      success: false,
      error: 'Description text is required',
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };
    res.status(400).json(response);
    return;
  }

  const themes = await aiProcessingService.extractThemes(description);

  const response: APIResponse = {
    success: true,
    data: themes,
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

// POST /api/ai/sanitize - Sanitize content for privacy
router.post('/sanitize', asyncHandler(async (req, res) => {
  const { description } = req.body;

  if (!description || typeof description !== 'string') {
    const response: APIResponse = {
      success: false,
      error: 'Description text is required',
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };
    res.status(400).json(response);
    return;
  }

  const sanitizedContent = await aiProcessingService.sanitizeContent(description);

  const response: APIResponse = {
    success: true,
    data: {
      original: description,
      sanitized: sanitizedContent,
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

// POST /api/ai/batch-process - Process multiple items
router.post('/batch-process', asyncHandler(async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    const response: APIResponse = {
      success: false,
      error: 'Items array is required',
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };
    res.status(400).json(response);
    return;
  }

  if (items.length > 5) {
    const response: APIResponse = {
      success: false,
      error: 'Maximum 5 items allowed per batch',
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };
    res.status(400).json(response);
    return;
  }

  const results = await aiProcessingService.batchProcess(items);

  const response: APIResponse = {
    success: true,
    data: {
      results,
      processed: results.length,
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

// GET /api/ai/cost-estimate - Estimate processing cost
router.post('/cost-estimate', asyncHandler(async (req, res) => {
  const { photo, text, location } = req.body;

  const estimatedCost = aiProcessingService.estimateProcessingCost({
    photo,
    text,
    location,
  });

  const response: APIResponse = {
    success: true,
    data: {
      estimatedCost,
      currency: 'USD',
      breakdown: {
        photoAnalysis: photo ? 0.01 : 0,
        textAnalysis: text ? 0.003 : 0,
        embedding: 0.0001,
      },
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

export { router as aiRoutes }; 