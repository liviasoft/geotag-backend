import { Router } from 'express';
import { placeholderHandler } from '../controllers/default';

const router = Router();

router.get('/', placeholderHandler); // get available verification options

export { router as verifyRoutes };
