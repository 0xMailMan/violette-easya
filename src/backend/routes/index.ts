import { Router } from 'express';
import { authRoutes } from './auth';
import { userRoutes } from './users';
import { aiRoutes } from './ai';
import { discoveryRoutes } from './discovery';
// import { blockchainRoutes } from './blockchain';

export const createAPIRoutes = (): Router => {
  const router = Router();

  // Mount route modules
  router.use('/auth', authRoutes);
  router.use('/users', userRoutes);
  router.use('/ai', aiRoutes);
  router.use('/discovery', discoveryRoutes);
  // router.use('/blockchain', blockchainRoutes);

  return router;
};

export default createAPIRoutes; 