import { generate } from 'otp-generator';

export const generateOTP = (
  length = 6,
  options = { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false },
) => {
  return generate(length, options);
};
