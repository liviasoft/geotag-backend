import { Request, Response } from 'express';
import { db } from '@neoncoder/geolocation-data';
// import { city, db, findClosestCities, AND as and, EQ as eq } from '@neoncoder/geolocation-data';
import { statusTypes } from '@neoncoder/typed-service-response';

export const getPhoneCountryCodes = async (_: Request, res: Response) => {
  const results = await db.query.country.findMany({
    columns: {
      id: true,
      name: true,
      phone_code: true,
      iso2: true,
      iso3: true,
      currency: true,
      currency_name: true,
      currency_symbol: true,
    },
    orderBy: (country, { asc }) => [asc(country.name)],
  });
  const sr = statusTypes.get('OK')!({ message: 'not yet implemented', data: { data: results } });
  return res.status(sr.statusCode).send(sr);
};
