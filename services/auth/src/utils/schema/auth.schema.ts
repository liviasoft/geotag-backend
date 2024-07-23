import { isNotEmpty, isValidUserName } from '@neoncoder/validator-utils';
import { object, string } from 'zod';

export const emailSignup = object({
  body: object({
    email: string().email({ message: 'Invalid email address' }),
    username: string({
      required_error: 'Username is required',
    }).refine(
      (data) => isValidUserName(data.toLowerCase()),
      'Username can only have lowercase (small) letters, numbers, and underscores',
    ),
    password: string().min(6, { message: 'Password must be at least 6 characters long' }),
  }),
});

export const emailLoginSchema = object({
  body: object({
    email: string().email({ message: 'Invalid email address' }),
    password: string().min(6, { message: 'Password must be at least 6 characters long' }),
  }),
});

export const usernameLoginSchema = object({
  body: object({
    username: string({
      required_error: 'Username is required',
    }).refine(
      (data) => isValidUserName(data.toLowerCase()),
      'Username can only have letters, numbers, and underscores',
    ),
    password: string().min(6, { message: 'Password must be at least 6 characters long' }),
  }),
});

export const phoneLoginSchema = object({
  body: object({
    phone: string({
      required_error: 'Phone number is required',
    }).refine((data) => isNotEmpty(data), 'Phone Number is required'),
    phoneCode: string({
      required_error: 'Phone Country Code is required',
    })
      .min(2, 'Invalid Country Code')
      .max(2, 'Invalid Country Code'),
    password: string().min(6, { message: 'Password must be at least 6 characters long' }),
  }),
});

export const phoneSignup = object({
  body: object({
    phone: string({
      required_error: 'Phone number is required',
    }).refine((data) => isNotEmpty(data), 'Phone Number is required'),
    phoneCode: string({
      required_error: 'Phone Country Code is required',
    })
      .min(2, 'Invalid Country Code')
      .max(2, 'Invalid Country Code'),
    username: string({
      required_error: 'Username is required',
    }).refine(
      (data) => isValidUserName(data.toLowerCase()),
      'Username can only have lowercase (small) letters, numbers, and underscores',
    ),
    password: string().min(6, { message: 'Password must be at least 6 characters long' }),
  }),
});
