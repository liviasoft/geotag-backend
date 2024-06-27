import { Router } from 'express';
import { placeholderHandler } from '../controllers/default';

const router = Router();

router.get('/', placeholderHandler); // get logged in user

export { router as currentUserRoutes };
