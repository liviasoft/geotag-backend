import { Router } from 'express';
import { sfff, zodValidate } from '../../middleware/common.middleware';
import {
  emailLoginHandler,
  getLoginOptionsHandler,
  phoneLoginHandler,
  usernameLoginHandler,
} from '../../controllers/auth/login.controllers';
import { emailLoginSchema, phoneLoginSchema, usernameLoginSchema } from '../../utils/schema/auth.schema';

const router = Router();

router.get('/', sfff('auth.login.options'), getLoginOptionsHandler); // get available login options
router.post('/email', sfff('auth.login.email'), zodValidate(emailLoginSchema, 'Email Login'), emailLoginHandler); // login with email
router.post('/phone', sfff('auth.login.phone'), zodValidate(phoneLoginSchema, 'Phone Login'), phoneLoginHandler); // login with phone number
router.post(
  '/username',
  sfff('auth.login.username'),
  zodValidate(usernameLoginSchema, 'Username Login'),
  usernameLoginHandler,
); // login with username;

export { router as loginRoutes };
