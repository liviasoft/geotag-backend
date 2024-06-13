import { Router } from 'express';
import { placeholderHandler } from '../controllers/default';
import { sfff } from '../middleware/common.middleware';

const router = Router();

router.get('/', sfff('auth.login.options'), placeholderHandler); // get available login options
router.post('/email', sfff('auth.login.email'), placeholderHandler); // login with email
router.post('/phone', sfff('auth.login.phone'), placeholderHandler); // login with phone number
router.post('/username', sfff('auth.login.username'), placeholderHandler); // login with username;

export { router as loginRoutes };
