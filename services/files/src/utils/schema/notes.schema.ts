import { isNotEmpty } from '@neoncoder/validator-utils';
import { object, string } from 'zod';

export const createNoteSchema = object({
  body: object({
    note: string({
      required_error: 'Note text is required',
    }).refine((data) => isNotEmpty(data), 'Note text is required'),
    location: string({
      required_error: 'Location Id is required',
    }).refine((data) => isNotEmpty(data), 'Location Id is required'),
    author: string({
      required_error: 'Author Id is required',
    }).refine((data) => isNotEmpty(data), 'Author Id is required'),
  }),
});
