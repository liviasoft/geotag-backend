import { Request, Response } from 'express';
import { Rez, TStatus, statusTypes } from '@neoncoder/typed-service-response';
import { ContactPostgresService } from '../../modules/postgres/contact.pg';
// import { getPocketBase } from '../../lib/pocketbase';
import { ContactPocketbaseService } from '../../modules/pocketbase/contacts.pb';
import { PhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js';

export const getLocationContactsHandler = async (req: Request, res: Response) => {
  const cpgs = new ContactPostgresService({});
  const result = (await cpgs.getFullList({})).result!;
  const sr = Rez[result.statusType]!({ ...result });
  return res.status(sr.statusCode).send(sr);
};

export const createLocationContactsHandler = async (req: Request, res: Response) => {
  const { phone, email, phoneCode, name, address } = req.body;
  console.log({ phone, email, phoneCode, name, address });
  if (!phone && !email && !name && !address) {
    const sr = statusTypes.get('BadRequest')!({ message: `Contact Email, Phone or Address required` });
    return res.status(sr.statusCode).send(sr);
  }
  const cpbs = new ContactPocketbaseService({ isAdmin: true });
  let parsedNumber: PhoneNumber | undefined;
  const checkFields: { [key: string]: string } = {};
  if (email) checkFields.email = email;
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
  const check = (await cpbs.findContactByUniqueField({ fieldValue: checkFields })).result! as TStatus<'contact'>;
  if (check.data?.contact) {
    const sr = statusTypes.get('Conflict')!({
      message: `Contact with ${email ? 'email - ' + email : 'phone - ' + parsedNumber?.number} already exists`,
      data: check.data,
      fix: 'please provide a unique email or phone number for new contact',
    });
    return res.status(sr.statusCode).send(sr);
  }
  if (req.body.id) delete req.body.id;
  const result = (await cpbs.createContact({ createData: req.body })).result! as TStatus<'contact'>;
  const sr = Rez[result.statusType]!({ ...result });
  return res.status(sr.statusCode).send(sr);
};
