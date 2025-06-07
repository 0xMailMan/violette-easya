"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    console.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        requestId: req.requestId,
        userId: req.user?.userId,
    });
    // Default error response
    const response = {
        success: false,
        error: err.message || 'Internal server error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId || 'unknown',
    };
    // Handle specific error types
    if (err.name === 'ValidationError') {
        res.status(400).json({
            ...response,
            error: 'Validation error: ' + err.message,
        });
        return;
    }
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({
            ...response,
            error: 'Authentication error: Invalid token',
        });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({
            ...response,
            error: 'Authentication error: Token expired',
        });
        return;
    }
    if (err.message.includes('rate limit')) {
        res.status(429).json({
            ...response,
            error: 'Rate limit exceeded',
        });
        return;
    }
    // Default 500 error
    res.status(500).json({
        ...response,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, next) => {
    const response = {
        success: false,
        error: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString(),
        requestId: req.requestId || 'unknown',
    };
    res.status(404).json(response);
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=error-handler.js.map