import { Router } from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { firebaseService } from '../database/firebase';
import { APIResponse } from '../../types/backend';

const router = Router();

// GET /api/entries - Get all entries for the authenticated user
router.get('/', [authMiddleware], asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  try {
    const entries = await firebaseService.getUserEntries(userId);

    const response: APIResponse = {
      success: true,
      data: entries,
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };

    res.status(500).json(response);
  }
}));

// GET /api/entries/:id - Get a specific entry
router.get('/:id', [authMiddleware], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  try {
    const entry = await firebaseService.getEntry(userId, id);

    if (!entry) {
      const response: APIResponse = {
        success: false,
        error: 'Entry not found',
        timestamp: new Date().toISOString(),
        requestId: req.requestId!,
      };
      res.status(404).json(response);
      return;
    }

    const response: APIResponse = {
      success: true,
      data: entry,
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };

    res.status(500).json(response);
  }
}));

// POST /api/entries - Create a new entry
router.post('/', [authMiddleware, requirePermission('write')], asyncHandler(async (req, res) => {
  const { type, content, analysis, metadata } = req.body;
  const userId = req.user!.userId;

  if (!type || !content) {
    const response: APIResponse = {
      success: false,
      error: 'Type and content are required',
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
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

    const entryId = await firebaseService.createEntry(userId, entryData);

    const response: APIResponse = {
      success: true,
      data: {
        id: entryId,
        ...entryData,
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };

    res.status(201).json(response);
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };

    res.status(500).json(response);
  }
}));

// PUT /api/entries/:id - Update an existing entry
router.put('/:id', [authMiddleware, requirePermission('write')], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type, content, analysis, metadata } = req.body;
  const userId = req.user!.userId;

  try {
    // Check if entry exists and belongs to user
    const existingEntry = await firebaseService.getEntry(userId, id);
    if (!existingEntry) {
      const response: APIResponse = {
        success: false,
        error: 'Entry not found',
        timestamp: new Date().toISOString(),
        requestId: req.requestId!,
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

    await firebaseService.updateEntry(userId, id, updateData);

    const response: APIResponse = {
      success: true,
      data: {
        id,
        ...existingEntry,
        ...updateData,
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };

    res.status(500).json(response);
  }
}));

// DELETE /api/entries/:id - Delete an entry
router.delete('/:id', [authMiddleware, requirePermission('write')], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  try {
    const entry = await firebaseService.getEntry(userId, id);
    if (!entry) {
      const response: APIResponse = {
        success: false,
        error: 'Entry not found',
        timestamp: new Date().toISOString(),
        requestId: req.requestId!,
      };
      res.status(404).json(response);
      return;
    }

    await firebaseService.deleteEntry(userId, id);

    const response: APIResponse = {
      success: true,
      data: { message: 'Entry deleted successfully' },
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };

    res.status(500).json(response);
  }
}));

export { router as entriesRoutes }; 