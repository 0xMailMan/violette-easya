import dotenv from 'dotenv';
import { BackendConfig } from '../../types/backend';

dotenv.config();

export const config: BackendConfig = {
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'violette-easya',
    serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '',
  },
  xrpl: {
    networkUrl: process.env.XRPL_NETWORK_URL || 'wss://s.altnet.rippletest.net:51233',
    isTestnet: process.env.NODE_ENV !== 'production',
  },
  ai: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    defaultModel: process.env.DEFAULT_AI_MODEL || 'claude-3-5-sonnet-20241022',
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  },
  storage: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    compressionQuality: parseInt(process.env.COMPRESSION_QUALITY || '80'),
  },
};

export const validateConfig = (): void => {
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_SERVICE_ACCOUNT_KEY',
    'ANTHROPIC_API_KEY',
    'JWT_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

export default config; 