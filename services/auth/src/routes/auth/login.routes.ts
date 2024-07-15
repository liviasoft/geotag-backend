import { Router } from 'express';
// import { placeholderHandler } from '../../controllers/default';
import { sfff } from '../../middleware/common.middleware';
import {
  emailLoginHandler,
  getLoginOptionsHandler,
  phoneLoginHandler,
  usernameLoginHandler,
} from '../../controllers/auth/login.controllers';

const router = Router();

router.get('/', sfff('auth.login.options'), getLoginOptionsHandler); // get available login options
router.post('/email', sfff('auth.login.email'), emailLoginHandler); // login with email
router.post('/phone', sfff('auth.login.phone'), phoneLoginHandler); // login with phone number
router.post('/username', sfff('auth.login.username'), usernameLoginHandler); // login with username;

export { router as loginRoutes };
