import { generate } from 'otp-generator';
import JWT from 'jsonwebtoken';
import { config } from '../../config/config';

export const generateOTP = (
  length = 6,
  options = { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false },
) => {
  return generate(length, options);
};

export const signJWT = (
  payload: any,
  secret: string = config.self.jwtSecret,
  options?: JWT.SignOptions | undefined,
) => {
  try {
    return {
      error: null,
      token: JWT.sign(payload, secret, { ...(options && options) }),
    };
  } catch (error: any) {
    console.log({ error });
    return {
      error,
      token: null,
    };
  }
};

export const verifyToken = (token: string, secret: string = config.self.jwtSecret) => {
  try {
    const decoded = JWT.verify(token, secret);
    return {
      valid: true,
      expired: false,
      decoded,
    };
  } catch (error: any) {
    console.log({ error });
    return {
      error,
      decoded: null,
      valid: false,
      expired: error.message === 'jwt expired',
    };
  }
};
