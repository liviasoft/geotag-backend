import { TMessageType } from './BaseClass.service';

export const findFirstAvailable = (obj: Record<string, string | number | boolean>) => {
  // Iterate over all properties in the object
  for (const key of Object.keys(obj)) {
    if (obj[key] === true) {
      // Check if the property's value is true
      return key; // Return the key of the first true value found
    }
  }
  return null; // Return null if no true value is found
};

/**
 * Converts all keys of an object to uppercase.
 *
 * @param obj - The object whose keys need to be converted to uppercase.
 * @returns A new object with all keys in uppercase.
 */
export const KeysToUppercase = <T extends object>(obj: T): { [K in keyof T as Uppercase<string & K>]: T[K] } => {
  const result: any = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const uppercaseKey = key.toUpperCase() as Uppercase<string & keyof T>;
      result[uppercaseKey] = obj[key];
    }
  }

  return result;
};

export const selectProviderConfig = async (type: TMessageType, provider: string) => {
  if (type === 'EMAIL') {
    switch (provider) {
      case 'AWS_SES':
        return {
          host: 'email-smtp.ap-northeast-1.amazonaws.com',
          port: 587,
          auth: {
            user: 'amazonsesuserid',
            pass: 'amazonsesuserpass',
          },
        };
      case 'ETHEREAL':
        return {
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
            user: 'unique11@ethereal.email',
            pass: '2fZx8QPhSRyEVhm1K5',
          },
        };
      default:
        return null;
    }
  }
  if (type === 'SMS') {
    switch (provider) {
      case 'TWILIO':
        return {};
      case 'VONAGE':
        return {};
      default:
        return null;
    }
  }
  if (type === 'PUSH_NOTIFICATION') {
    switch (provider) {
      case 'ONE_SIGNAL':
        return {};
      case 'PUSHER':
        return {};
      default:
        break;
    }
  }
  return null;
};
