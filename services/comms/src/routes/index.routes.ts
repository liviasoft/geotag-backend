import { Router } from 'express';
import { defaultHandler } from '../controllers/default';
import { templateRoutes } from './templates.routes';

const router = Router();

router.get('/', defaultHandler);
router.get('/ping', (_, res) => res.status(200).send('Comms Service pong'));
router.use('/templates', templateRoutes);

export { router as commsServiceRoutes };
