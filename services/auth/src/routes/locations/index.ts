import { Router } from 'express';
import { getLocationCountsHandler, getSavedLocationsHandler } from '../../controllers/location/search.controllers';
import {
  createLocationHandler,
  deleteLocationHandler,
  fixCityData,
  getNearestCitiesHandler,
  updateLocationHandler,
  locationExists,
  testDeviceConnectionHandler,
  sendDeviceCommandHandler,
  getLocationDetailsHandler,
} from '../../controllers/location/crud.controllers';
import { zodValidate } from '../../middleware/common.middleware';
import { createSiteSchema, deviceCommandSchema } from '../../utils/schema/location.schema';
import { countryRoutes } from './countries.routes';
import { requireLoggedInUser } from '../../middleware/auth';
import { placeholderHandler } from '../../controllers/default';

const router = Router();

router.get('/', getLocationCountsHandler);
router.get('/sites', getSavedLocationsHandler);
router.post('/sites', requireLoggedInUser, zodValidate(createSiteSchema, 'Location'), createLocationHandler);
router.get('/sites/:locationId/test-connection', testDeviceConnectionHandler);
// router.post('/site')
router.get('/fix', fixCityData);
router.use('/countries', countryRoutes);
router.get('/nearest-cities', getNearestCitiesHandler);
router.get('/sites/:locationId', getLocationDetailsHandler);
router.patch('/sites/:locationId', requireLoggedInUser, updateLocationHandler);
router.post(
  '/sites/:locationId/command',
  zodValidate(deviceCommandSchema, 'Device Command'),
  requireLoggedInUser,
  sendDeviceCommandHandler,
);
router.delete('/sites/:locationId', requireLoggedInUser, deleteLocationHandler);
router.get('/test', placeholderHandler);

router.param('locationId', locationExists);

export { router as locationRoutes };
