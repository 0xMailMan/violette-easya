import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { validateConfig } from './config';
import { createAPIRoutes } from './routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth';
import { loggingMiddleware } from './middleware/logging';
import firebaseService from './database/firebase';
import blockchainService from './services/blockchain';
import config from './config';

class VioletteBackendServer {
  private app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
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
    this.app.use(cors({
      origin: config.security.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.security.rateLimitWindow,
      max: config.security.rateLimitMax,
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
    });
    this.app.use(limiter);

    // Body parsing and compression
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Custom middleware
    this.app.use(loggingMiddleware);

    // File upload middleware
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: config.storage.maxFileSize,
      },
      fileFilter: (req, file, cb) => {
        if (config.storage.allowedImageTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
        }
      },
    });

    this.app.use('/api/upload', upload.single('image'));
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const [firebaseHealth, blockchainHealth] = await Promise.all([
          firebaseService.healthCheck(),
          blockchainService.healthCheck(),
        ]);

        const status = firebaseHealth && blockchainHealth ? 'healthy' : 'unhealthy';
        const statusCode = status === 'healthy' ? 200 : 503;

        res.status(statusCode).json({
          status,
          timestamp: new Date().toISOString(),
          services: {
            firebase: firebaseHealth ? 'up' : 'down',
            blockchain: blockchainHealth ? 'up' : 'down',
          },
        });
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // API routes
    this.app.use('/api', createAPIRoutes());

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

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(port: number = 8000): Promise<void> {
    try {
      // Validate configuration
      validateConfig();

      // Start server
      this.server = this.app.listen(port, () => {
        console.log(`🚀 Violette Backend Server running on port ${port}`);
        console.log(`📚 API Documentation available at http://localhost:${port}/docs`);
        console.log(`🔍 Health check available at http://localhost:${port}/health`);
        
        if (config.xrpl.isTestnet) {
          console.log('⚠️  Running in testnet mode');
        }
      });

      // Graceful shutdown handling
      process.on('SIGTERM', () => this.gracefulShutdown());
      process.on('SIGINT', () => this.gracefulShutdown());

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private async gracefulShutdown(): Promise<void> {
    console.log('🔄 Initiating graceful shutdown...');

    try {
      // Close server
      if (this.server) {
        this.server.close(() => {
          console.log('✅ HTTP server closed');
        });
      }

      // Close database connections
      await blockchainService.disconnect();
      console.log('✅ Database connections closed');

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Create and export server instance
const server = new VioletteBackendServer();

// Start server if this file is run directly
if (require.main === module) {
  const port = parseInt(process.env.PORT || '8000', 10);
  server.start(port);
}

export default server;
export { VioletteBackendServer }; 