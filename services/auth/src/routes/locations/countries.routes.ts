import { Router } from 'express';
import {
  cityExists,
  countryExists,
  createCityHandler,
  getCitiesHandler,
  getCountriesHandler,
  getStatesHandler,
  stateExists,
} from '../../controllers/location/countries.controllers';
import { requireLoggedInUser } from '../../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', getCountriesHandler);
router.get('/:countryId/states', getStatesHandler);
router.get('/:countryId/states/:stateId/cities', getCitiesHandler);
router.post('/:countryId/states/:stateId/cities', requireLoggedInUser, createCityHandler);

router.param('countryId', countryExists);
router.param('stateId', stateExists);
router.param('cityId', cityExists);

export { router as countryRoutes };
