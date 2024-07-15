import { Router } from 'express';
import { loginRoutes } from './login.routes';
import { currentUserRoutes } from './currentuser.routes';
import { verifyRoutes } from './verify.routes';
import { signupRoutes } from './signup.routes';
import { sf } from '../../middleware/common.middleware';
import { defaultHandler } from '../../controllers/default';

const router = Router();

router.use('/me', currentUserRoutes);
router.use('/signup', sf('auth.signup'), signupRoutes);
router.use('/verify', verifyRoutes);
router.use('/login', sf('auth.login'), loginRoutes);
router.get('/settings', defaultHandler);

export { router as authRoutes };
