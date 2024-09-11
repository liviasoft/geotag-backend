import { Router } from 'express';
import { defaultHanlder, parseTestHandler, tcpConnectionTestHandler } from '../controllers/default.controllers';
import { locationRoutes } from './location.routes';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import {
  deviceInspectionQueue,
  fileProcessingQueue,
  fileStorageQueue,
  fileCheckQueue,
  fileUpdateQueue,
  signalStorageQueue,
  deviceConnectionQueue,
} from '../services/bulljsQueues/device.queues';

const router = Router();

const serverAdapter = new ExpressAdapter();
const bullAdminPath = `/queues/bull/admin/queues`;
serverAdapter.setBasePath(`/api/v1/files${bullAdminPath}`);

createBullBoard({
  queues: [
    new BullAdapter(deviceConnectionQueue),
    new BullAdapter(deviceInspectionQueue),
    new BullAdapter(fileCheckQueue),
    new BullAdapter(fileStorageQueue),
    new BullAdapter(fileProcessingQueue),
    new BullAdapter(fileUpdateQueue),
    new BullAdapter(signalStorageQueue),
  ],
  serverAdapter,
});

router.get('/', defaultHanlder);
router.use(bullAdminPath, serverAdapter.getRouter());
router.use('/locations', locationRoutes);
router.get('/ping', (_, res) => res.status(200).send('Files Service pong'));
router.get('/test', parseTestHandler);
router.get('/tcp', tcpConnectionTestHandler);

export { router as filesServiceRoutes };
