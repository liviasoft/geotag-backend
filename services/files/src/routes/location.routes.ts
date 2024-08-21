import { Router } from 'express';
import {
  deviceExists,
  getDeviceMeasurementFilesHandler,
  getFileSignalDataHandler,
  getStoredMeasurementFilesHandler,
  locationExists,
  measurementFileExists,
  triggerFileProcessingHandler,
} from '../controllers/devices/measurement-files.controllers';
import { locationNoteRoutes } from './notes.routes';
import { requireLoggedInUser } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', (req, res) => res.send('ping'));
router.get('/notes', (req, res) => res.send('ping'));
router.use('/:locationId/notes', locationNoteRoutes);
router.get('/:deviceId/measurement-files', getStoredMeasurementFilesHandler);
router.get('/:deviceId/device/measurement-files', getDeviceMeasurementFilesHandler);
router.get('/:deviceId/measurement-files/:fileId', requireLoggedInUser, triggerFileProcessingHandler);
router.get('/:deviceId/measurement-files/:fileId/data', getFileSignalDataHandler);

router.param('deviceId', deviceExists);
router.param('locationId', locationExists);
router.param('fileId', measurementFileExists);

router.param;
export { router as locationRoutes };
