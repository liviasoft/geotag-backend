import { Router } from 'express';
// import { placeholderHandler } from '../../controllers/default';
import { getCurrentUserHandler } from '../../controllers/auth/me.controllers';

const router = Router();

router.get('/', getCurrentUserHandler); // get logged in user

export { router as currentUserRoutes };
