import { Router } from 'express';
import { getLocationCountsHandler, getSavedLocationsHandler } from '../../controllers/location/search.controllers';
import {
  createLocationHandler,
  deleteLocationHandler,
  fixCityData,
  getNearestCitiesHandler,
  updateLocationHandler,
} from '../../controllers/location/crud.controllers';
import { zodValidate } from '../../middleware/common.middleware';
import { createSiteSchema } from '../../utils/schema/location.schema';
import { countryRoutes } from './countries.routes';
import { requireLoggedInUser } from '../../middleware/auth';

const router = Router();

router.get('/', getLocationCountsHandler);
router.get('/sites', getSavedLocationsHandler);
router.post('/sites', requireLoggedInUser, zodValidate(createSiteSchema, 'Location'), createLocationHandler);
router.get('/fix', fixCityData);
router.use('/countries', countryRoutes);
router.get('/nearest-cities', getNearestCitiesHandler);
router.patch('/:locationId', requireLoggedInUser, updateLocationHandler);
router.delete('/:locationId', requireLoggedInUser, deleteLocationHandler);

export { router as locationRoutes };
