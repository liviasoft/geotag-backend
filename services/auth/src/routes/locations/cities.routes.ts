import { Router } from 'express';
import { getStatesHandler } from '../../controllers/location/countries.controllers';

const router = Router({ mergeParams: true });

router.get('/', getStatesHandler);

export { router as stateRoutes };
