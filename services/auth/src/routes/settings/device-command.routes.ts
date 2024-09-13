import { Router } from 'express';
import {
  addDeviceCommandHandler,
  batchCreateDeviceCommandsHandler,
  deleteDeviceCommandsHandler,
  deviceCommandExists,
  getDeviceCommandsHandler,
  updateDeviceCommandsHandler,
} from '../../controllers/settings/device.controllers';
import { zodValidate } from '../../middleware/common.middleware';
import { createDeviceCommandSchema } from '../../utils/schema/location.schema';
import { requireLoggedInUser } from '../../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', getDeviceCommandsHandler);
router.post(
  '/',
  zodValidate(createDeviceCommandSchema, 'Device Command'),
  requireLoggedInUser,
  addDeviceCommandHandler,
);
router.post('/batch', requireLoggedInUser, batchCreateDeviceCommandsHandler);
router.patch('/:deviceCommandId', updateDeviceCommandsHandler);
router.delete('/:deviceCommandId', deleteDeviceCommandsHandler);

router.param('deviceCommandId', deviceCommandExists);
export { router as deviceCommandRoutes };
