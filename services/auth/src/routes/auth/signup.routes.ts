import { Router } from 'express';
// import { placeholderHandler } from '../../controllers/default';
import { sfff, zodValidate } from '../../middleware/common.middleware';
import { emailSignup, phoneSignup } from '../../utils/schema/auth.schema';
import {
  emailSignupHandler,
  getSignupOptionsHandler,
  phoneSignupHandler,
} from '../../controllers/auth/signup.controllers';

const router = Router();

router.get('/', sfff('auth.signup.options'), getSignupOptionsHandler); // get available signup options
router.post('/email', sfff('auth.signup.email'), zodValidate(emailSignup, 'Signup'), emailSignupHandler); // signup with email
router.post('/phone', sfff('auth.signup.phone'), zodValidate(phoneSignup, 'Signup'), phoneSignupHandler); // signup with phone

export { router as signupRoutes };
