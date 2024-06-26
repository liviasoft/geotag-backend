import { Router } from 'express';
import { defaultHandler } from '../controllers/default';
import { templateRoutes } from './templates.routes';

const router = Router();

router.get('/', defaultHandler);
router.use('/templates', templateRoutes);

export { router as commsServiceRoutes };
