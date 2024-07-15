import { Router } from 'express';
import { defaultHanlder, parseTestHandler, tcpConnectionTestHandler } from '../controllers/default.controllers';

const router = Router();

router.get('/', defaultHanlder);
router.get('/test', parseTestHandler);
router.get('/tcp', tcpConnectionTestHandler);

export { router as filesServiceRoutes };
