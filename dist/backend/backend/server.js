"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VioletteBackendServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const multer_1 = __importDefault(require("multer"));
const config_1 = require("./config");
const routes_1 = require("./routes");
const error_handler_1 = require("./middleware/error-handler");
const logging_1 = require("./middleware/logging");
const firebase_1 = __importDefault(require("./database/firebase"));
const blockchain_1 = __importDefault(require("./services/blockchain"));
const config_2 = __importDefault(require("./config"));
class VioletteBackendServer {
    constructor() {
        this.app = (0, express_1.default)();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    initializeMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)({
            crossOriginEmbedderPolicy: false, // For image uploads
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "blob:"],
                },
            },
        }));
        // CORS configuration
        this.app.use((0, cors_1.default)({
            origin: config_2.default.security.corsOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
        }));
        // Rate limiting
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: config_2.default.security.rateLimitWindow,
            max: config_2.default.security.rateLimitMax,
            message: {
                error: 'Too many requests from this IP, please try again later.',
            },
        });
        this.app.use(limiter);
        // Body parsing and compression
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Custom middleware
        this.app.use(logging_1.loggingMiddleware);
        // File upload middleware
        const upload = (0, multer_1.default)({
            storage: multer_1.default.memoryStorage(),
            limits: {
                fileSize: config_2.default.storage.maxFileSize,
            },
            fileFilter: (req, file, cb) => {
                if (config_2.default.storage.allowedImageTypes.includes(file.mimetype)) {
                    cb(null, true);
                }
                else {
                    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
                }
            },
        });
        this.app.use('/api/upload', upload.single('image'));
    }
    initializeRoutes() {
        // Health check endpoint
        this.app.get('/health', async (req, res) => {
            try {
                const [firebaseHealth, blockchainHealth] = await Promise.all([
                    firebase_1.default.healthCheck(),
                    blockchain_1.default.healthCheck(),
                ]);
                const status = (firebaseHealth && blockchainHealth) ? 'healthy' : 'unhealthy';
                const statusCode = status === 'healthy' ? 200 : 503;
                res.status(statusCode).json({
                    status,
                    timestamp: new Date().toISOString(),
                    services: {
                        firebase: firebaseHealth ? 'up' : 'down',
                        blockchain: blockchainHealth ? 'up' : 'down',
                    },
                });
            }
            catch (error) {
                res.status(503).json({
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        });
        // API routes
        this.app.use('/api', (0, routes_1.createAPIRoutes)());
        // Documentation endpoint
        this.app.get('/docs', (req, res) => {
            res.json({
                name: 'Violette EasyA Backend API',
                version: '1.0.0',
                description: 'Backend services for the Violette anonymous diary and discovery platform',
                endpoints: {
                    auth: {
                        'POST /api/auth/anonymous': 'Create anonymous session',
                        'POST /api/auth/did': 'Authenticate with DID',
                        'POST /api/auth/refresh': 'Refresh session token',
                    },
                    users: {
                        'GET /api/users/profile': 'Get user profile',
                        'PUT /api/users/profile': 'Update user profile',
                        'GET /api/users/settings': 'Get user settings',
                        'PUT /api/users/settings': 'Update user settings',
                    },
                    entries: {
                        'POST /api/entries': 'Create diary entry',
                        'GET /api/entries': 'Get user entries',
                        'GET /api/entries/:id': 'Get specific entry',
                        'PUT /api/entries/:id': 'Update entry',
                        'DELETE /api/entries/:id': 'Delete entry',
                    },
                    ai: {
                        'POST /api/ai/analyze': 'Analyze content with AI',
                        'POST /api/ai/generate-embedding': 'Generate embedding vector',
                        'POST /api/ai/extract-themes': 'Extract themes from content',
                    },
                    discovery: {
                        'GET /api/discovery/similar-users': 'Find similar users',
                        'GET /api/discovery/recommendations': 'Get recommendations',
                        'POST /api/discovery/update-clusters': 'Update user clusters',
                    },
                    blockchain: {
                        'POST /api/blockchain/create-did': 'Create new DID',
                        'POST /api/blockchain/store-merkle': 'Store merkle root',
                        'GET /api/blockchain/verify/:hash': 'Verify merkle root',
                        'GET /api/blockchain/resolve-did/:did': 'Resolve DID',
                    },
                },
            });
        });
    }
    initializeErrorHandling() {
        // 404 handler
        this.app.use(error_handler_1.notFoundHandler);
        // Global error handler
        this.app.use(error_handler_1.errorHandler);
    }
    async start(port = 8000) {
        try {
            // Validate configuration
            (0, config_1.validateConfig)();
            // Start server
            this.server = this.app.listen(port, () => {
                console.log(`🚀 Violette Backend Server running on port ${port}`);
                console.log(`📚 API Documentation available at http://localhost:${port}/docs`);
                console.log(`🔍 Health check available at http://localhost:${port}/health`);
                if (config_2.default.xrpl.isTestnet) {
                    console.log('⚠️  Running in testnet mode');
                }
            });
            // Graceful shutdown handling
            process.on('SIGTERM', () => this.gracefulShutdown());
            process.on('SIGINT', () => this.gracefulShutdown());
        }
        catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }
    async gracefulShutdown() {
        console.log('🔄 Initiating graceful shutdown...');
        try {
            // Close server
            if (this.server) {
                this.server.close(() => {
                    console.log('✅ HTTP server closed');
                });
            }
            // Close database connections
            await blockchain_1.default.disconnect();
            console.log('✅ Database connections closed');
            console.log('✅ Graceful shutdown completed');
            process.exit(0);
        }
        catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    }
    getApp() {
        return this.app;
    }
}
exports.VioletteBackendServer = VioletteBackendServer;
// Create and export server instance
const server = new VioletteBackendServer();
// Start server if this file is run directly
if (require.main === module) {
    const port = parseInt(process.env.PORT || '8000', 10);
    server.start(port);
}
exports.default = server;
//# sourceMappingURL=server.js.map