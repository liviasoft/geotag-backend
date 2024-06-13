import { Router } from 'express';
import { placeholderHandler } from '../controllers/default';
import { sfff } from '../middleware/common.middleware';

const router = Router();

router.get('/', sfff('auth.signup.options'), placeholderHandler); // get available signup options
router.get('/email', sfff('auth.signup.email'), placeholderHandler); // signup with email
router.get('/phone', sfff('auth.signup.phone'), placeholderHandler); // signup with phone
router.get('/', placeholderHandler); // get available signup options

export { router as signupRoutes };
