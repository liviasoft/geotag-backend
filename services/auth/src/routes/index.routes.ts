import { Router } from 'express';
import { authRoutes } from './auth/index.routes';
import { locationRoutes } from './locations';
import { scope } from '../middleware/settings';
import { settingsRoutes } from './settings/index.routes';

const router = Router();

router.use('/auth', scope('auth'), authRoutes);
router.use('/locations', locationRoutes);
router.use('/settings', settingsRoutes);

export { router as appRoutes };
