import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'violette-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log incoming request
  const requestLog = {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    requestId: req.requestId,
    userId: req.user?.userId,
    timestamp: new Date().toISOString(),
  };

  logger.info('Incoming request', requestLog);

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - startTime;
    
    const responseLog = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.requestId,
      userId: req.user?.userId,
      responseSize: JSON.stringify(body).length,
      timestamp: new Date().toISOString(),
    };

    if (res.statusCode >= 400) {
      logger.error('Request completed with error', responseLog);
    } else {
      logger.info('Request completed', responseLog);
    }

    return originalJson.call(this, body);
  };

  next();
};

export { logger }; 