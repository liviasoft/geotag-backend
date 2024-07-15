import { Router } from 'express';
import { defaultHandler } from '../../controllers/default';
import { getLocationTypesHandler } from '../../controllers/settings/locationTypes.controllers';
import {
  createLocationContactsHandler,
  getLocationContactsHandler,
} from '../../controllers/settings/locationContacts.controllers';
import { getPhoneCountryCodes } from '../../controllers/settings/defaults.controllers';

const router = Router();

router.get('/', defaultHandler);
router.get('/country-codes', getPhoneCountryCodes);
router.get('/location-types', getLocationTypesHandler);
router.get('/contacts', getLocationContactsHandler);
router.post('/contacts', createLocationContactsHandler);

export { router as settingsRoutes };
