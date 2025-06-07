"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const error_handler_1 = require("../middleware/error-handler");
const ai_processing_1 = __importDefault(require("../services/ai-processing"));
const router = (0, express_1.Router)();
exports.aiRoutes = router;
// All AI routes require authentication and rate limiting
router.use(auth_1.authMiddleware);
router.use((0, auth_1.rateLimitByUser)(10, 60000)); // 10 requests per minute
// POST /api/ai/analyze - Analyze content with AI
router.post('/analyze', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { photo, text, location } = req.body;
    if (!photo && !text) {
        const response = {
            success: false,
            error: 'Either photo or text content is required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(400).json(response);
        return;
    }
    // Validate photo if provided
    if (photo) {
        const isValidImage = await ai_processing_1.default.validateImageContent(photo);
        if (!isValidImage) {
            const response = {
                success: false,
                error: 'Invalid image format or size',
                timestamp: new Date().toISOString(),
                requestId: req.requestId,
            };
            res.status(400).json(response);
            return;
        }
    }
    const analysis = await ai_processing_1.default.analyzeContent({
        photo,
        text,
        location,
    });
    const response = {
        success: true,
        data: analysis,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
// POST /api/ai/generate-embedding - Generate embedding vector
router.post('/generate-embedding', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { description } = req.body;
    if (!description || typeof description !== 'string') {
        const response = {
            success: false,
            error: 'Description text is required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(400).json(response);
        return;
    }
    const embedding = await ai_processing_1.default.generateEmbedding(description);
    const response = {
        success: true,
        data: {
            embedding,
            dimensions: embedding.length,
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
// POST /api/ai/extract-themes - Extract themes from content
router.post('/extract-themes', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { description } = req.body;
    if (!description || typeof description !== 'string') {
        const response = {
            success: false,
            error: 'Description text is required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(400).json(response);
        return;
    }
    const themes = await ai_processing_1.default.extractThemes(description);
    const response = {
        success: true,
        data: themes,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
// POST /api/ai/sanitize - Sanitize content for privacy
router.post('/sanitize', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { description } = req.body;
    if (!description || typeof description !== 'string') {
        const response = {
            success: false,
            error: 'Description text is required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(400).json(response);
        return;
    }
    const sanitizedContent = await ai_processing_1.default.sanitizeContent(description);
    const response = {
        success: true,
        data: {
            original: description,
            sanitized: sanitizedContent,
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
// POST /api/ai/batch-process - Process multiple items
router.post('/batch-process', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        const response = {
            success: false,
            error: 'Items array is required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(400).json(response);
        return;
    }
    if (items.length > 5) {
        const response = {
            success: false,
            error: 'Maximum 5 items allowed per batch',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(400).json(response);
        return;
    }
    const results = await ai_processing_1.default.batchProcess(items);
    const response = {
        success: true,
        data: {
            results,
            processed: results.length,
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
// GET /api/ai/cost-estimate - Estimate processing cost
router.post('/cost-estimate', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { photo, text, location } = req.body;
    const estimatedCost = ai_processing_1.default.estimateProcessingCost({
        photo,
        text,
        location,
    });
    const response = {
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
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
//# sourceMappingURL=ai.js.map