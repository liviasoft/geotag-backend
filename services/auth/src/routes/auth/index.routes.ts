import { Router } from 'express';
import { loginRoutes } from './login.routes';
import { currentUserRoutes } from './currentuser.routes';
import { verifyRoutes } from './verify.routes';
import { signupRoutes } from './signup.routes';
import { sf } from '../../middleware/common.middleware';
import { defaultHandler } from '../../controllers/default';
import { logoutHandler } from '../../controllers/auth/me.controllers';

const router = Router();

router.use('/me', currentUserRoutes);
router.use('/signup', sf('auth.signup'), signupRoutes);
router.use('/login', sf('auth.login'), loginRoutes);
router.get('/logout', logoutHandler);
router.use('/verify', verifyRoutes);
router.get('/settings', defaultHandler);

export { router as authRoutes };
