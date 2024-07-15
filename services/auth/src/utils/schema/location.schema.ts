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
