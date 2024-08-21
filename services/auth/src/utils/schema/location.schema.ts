import { isNotEmpty } from '@neoncoder/validator-utils';
import { number, object, string } from 'zod';

export const createSiteSchema = object({
  body: object({
    name: string({
      required_error: 'Location Name is required',
    }),
    longitude: number({
      required_error: 'Longitude is required',
    }),
    latitude: number({
      required_error: 'Latitude is required',
    }),
    locationType: string({
      required_error: 'Location type is required',
    }),
  }),
});

export const updateSiteSchema = object({
  body: object({
    name: string({}).optional(),
    longitude: number({}).optional(),
    latitude: number({}).optional(),
  }),
});

export const deviceCommandSchema = object({
  body: object({
    command: string({
      required_error: 'Command text is required',
    }).refine((data) => isNotEmpty(data), 'Command cannot be empty'),
  }),
});

export const createDeviceCommandSchema = object({
  body: object({
    command: string({
      required_error: 'Command is required',
    }).refine((data) => isNotEmpty(data), 'Command cannot be empty'),
    title: string({
      required_error: 'Title is required',
    }).refine((data) => isNotEmpty(data), 'Command cannot be empty'),
    description: string({
      required_error: 'Description text is required',
    }).refine((data) => isNotEmpty(data), 'Command cannot be empty'),
    commandType: string({
      required_error: 'Command Type text is required',
    }).refine((data) => isNotEmpty(data) && ['Command', 'Query'].includes(data), 'Command cannot be empty'),
  }),
});
