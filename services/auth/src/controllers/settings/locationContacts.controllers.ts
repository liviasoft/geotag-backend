import { Request, Response } from 'express';
import { Rez, TStatus, statusTypes } from '@neoncoder/typed-service-response';
import { ContactPostgresService } from '../../modules/postgres/contact.pg';
// import { getPocketBase } from '../../lib/pocketbase';
import { ContactPocketbaseService } from '../../modules/pocketbase/contacts.pb';
import { PhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js';
import { isValidEmail } from '@neoncoder/validator-utils';
import { Prisma } from '@prisma/client';

export const getLocationContactsHandler = async (req: Request, res: Response) => {
  const cpgs = new ContactPostgresService({});
  const result = (await cpgs.getFullList({})).result!;
  const sr = Rez[result.statusType]!({ ...result });
  return res.status(sr.statusCode).send(sr);
};

export const createLocationContactsHandler = async (req: Request, res: Response) => {
  const { phone, email, phoneCode, name, address } = req.body;
  console.log({ phone, email, phoneCode, name, address });
  if (!phone && !email && !address) {
    const sr = statusTypes.get('BadRequest')!({ message: `Contact Email, Phone or Address required` });
    return res.status(sr.statusCode).send(sr);
  }
  const cpgs = new ContactPostgresService({});
  const cpbs = new ContactPocketbaseService({ isAdmin: true });
  let parsedNumber: PhoneNumber | undefined;
  const checkFields: { [key: string]: string } = {};
  if (email) {
    if (!isValidEmail(email)) {
      const sr = statusTypes.get('BadRequest')!({
        error: { email: 'Email is invalid' },
        message: 'Invalid Email address',
      });
      return res.status(sr.statusCode).send(sr);
    }
    checkFields.email = email;
  }
  if (phone && phoneCode) {
    try {
      parsedNumber = parsePhoneNumberWithError(phone, phoneCode);
      checkFields.phone = parsedNumber.number;
    } catch (error: any) {
      console.log({ error });
      const sr = statusTypes.get('BadRequest')!({ error, message: 'Invalid Phone Number', errMessage: error.message });
      return res.status(sr.statusCode).send(sr);
    }
  }
  const filters: Prisma.ContactWhereInput = { OR: [] };
  Object.entries(checkFields).forEach(([key, value]) => {
    filters.OR?.push({ [key]: { equals: value, mode: 'insensitive' } });
  });
  const check = (await cpgs.findFirst({ filters })).result! as TStatus<'contact'>;
  console.log({ check });
  if (check.data?.contact) {
    const sr = statusTypes.get('Conflict')!({
      message: `Contact with ${email ? 'email - ' + email : 'phone - ' + parsedNumber?.number} already exists`,
      data: check.data,
      error: {
        email: email ? `Contact with ${email} already exists` : undefined,
        phone: phone ? `Contact with ${parsedNumber?.number} already exists` : undefined,
      },
      fix: 'please provide a unique email or phone number for new contact',
    });
    return res.status(sr.statusCode).send(sr);
  }
  if (req.body.id) delete req.body.id;
  const result = (await cpbs.createContact({ createData: { ...req.body, addedBy: res.locals.authUserId } }))
    .result! as TStatus<'contact'>;
  const sr = Rez[result.statusType]!({ ...result });
  return res.status(sr.statusCode).send(sr);
};
