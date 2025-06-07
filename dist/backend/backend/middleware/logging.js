"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.loggingMiddleware = void 0;
const winston_1 = __importDefault(require("winston"));
// Create Winston logger
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: { service: 'violette-backend' },
    transports: [
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: 'logs/combined.log' }),
    ],
});
exports.logger = logger;
// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
    }));
}
const loggingMiddleware = (req, res, next) => {
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
    res.json = function (body) {
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
        }
        else {
            logger.info('Request completed', responseLog);
        }
        return originalJson.call(this, body);
    };
    next();
};
exports.loggingMiddleware = loggingMiddleware;
//# sourceMappingURL=logging.js.map