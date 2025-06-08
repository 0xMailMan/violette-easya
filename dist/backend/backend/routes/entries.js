"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entriesRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const error_handler_1 = require("../middleware/error-handler");
const firebase_1 = require("../database/firebase");
const router = (0, express_1.Router)();
exports.entriesRoutes = router;
// GET /api/entries - Get all entries for the authenticated user
router.get('/', [auth_1.authMiddleware], (0, error_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    try {
        const entries = await firebase_1.firebaseService.getUserEntries(userId);
        const response = {
            success: true,
            data: entries,
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(500).json(response);
    }
}));
// GET /api/entries/:id - Get a specific entry
router.get('/:id', [auth_1.authMiddleware], (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    try {
        const entry = await firebase_1.firebaseService.getEntry(userId, id);
        if (!entry) {
            const response = {
                success: false,
                error: 'Entry not found',
                timestamp: new Date().toISOString(),
                requestId: req.requestId,
            };
            res.status(404).json(response);
            return;
        }
        const response = {
            success: true,
            data: entry,
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(500).json(response);
    }
}));
// POST /api/entries - Create a new entry
router.post('/', [auth_1.authMiddleware, (0, auth_1.requirePermission)('write')], (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { type, content, analysis, metadata } = req.body;
    const userId = req.user.userId;
    if (!type || !content) {
        const response = {
            success: false,
            error: 'Type and content are required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(400).json(response);
        return;
    }
    try {
        const entryData = {
            type,
            content,
            analysis: analysis || null,
            metadata: metadata || {},
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const entryId = await firebase_1.firebaseService.createEntry(userId, entryData);
        const response = {
            success: true,
            data: {
                id: entryId,
                ...entryData,
            },
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(201).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(500).json(response);
    }
}));
// PUT /api/entries/:id - Update an existing entry
router.put('/:id', [auth_1.authMiddleware, (0, auth_1.requirePermission)('write')], (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { type, content, analysis, metadata } = req.body;
    const userId = req.user.userId;
    try {
        // Check if entry exists and belongs to user
        const existingEntry = await firebase_1.firebaseService.getEntry(userId, id);
        if (!existingEntry) {
            const response = {
                success: false,
                error: 'Entry not found',
                timestamp: new Date().toISOString(),
                requestId: req.requestId,
            };
            res.status(404).json(response);
            return;
        }
        const updateData = {
            ...(type && { type }),
            ...(content && { content }),
            ...(analysis && { analysis }),
            ...(metadata && { metadata }),
            updatedAt: new Date(),
        };
        await firebase_1.firebaseService.updateEntry(userId, id, updateData);
        const response = {
            success: true,
            data: {
                id,
                ...existingEntry,
                ...updateData,
            },
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(500).json(response);
    }
}));
// DELETE /api/entries/:id - Delete an entry
router.delete('/:id', [auth_1.authMiddleware, (0, auth_1.requirePermission)('write')], (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    try {
        const entry = await firebase_1.firebaseService.getEntry(userId, id);
        if (!entry) {
            const response = {
                success: false,
                error: 'Entry not found',
                timestamp: new Date().toISOString(),
                requestId: req.requestId,
            };
            res.status(404).json(response);
            return;
        }
        await firebase_1.firebaseService.deleteEntry(userId, id);
        const response = {
            success: true,
            data: { message: 'Entry deleted successfully' },
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(500).json(response);
    }
}));
//# sourceMappingURL=entries.js.map