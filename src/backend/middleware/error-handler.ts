import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '../../types/backend';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    requestId: req.requestId,
    userId: req.user?.userId,
  });

  // Default error response
  const response: APIResponse = {
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

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const response: APIResponse = {
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    requestId: req.requestId || 'unknown',
  };

  res.status(404).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 