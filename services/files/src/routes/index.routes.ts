import { Router } from 'express';
import { defaultHanlder, parseTestHandler, tcpConnectionTestHandler } from '../controllers/default.controllers';

const router = Router();

router.get('/', defaultHanlder);
router.get('/ping', (_, res) => res.status(200).send('Files Service pong'));
router.get('/test', parseTestHandler);
router.get('/tcp', tcpConnectionTestHandler);

export { router as filesServiceRoutes };
