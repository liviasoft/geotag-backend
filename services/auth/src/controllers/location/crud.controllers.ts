import { city, db, findClosestCities, AND as and, EQ as eq } from '@neoncoder/geolocation-data';
import { TStatus, statusTypes } from '@neoncoder/typed-service-response';
import { Request, Response } from 'express';
import { LocationPocketbaseService } from '../../modules/pocketbase/locations.pb';
import { isValidDate } from '@neoncoder/validator-utils';
// import spanishCities from './spanishCities.json';

export const createLocationHandler = async (req: Request, res: Response) => {
  const { name, longitude, latitude, locationType, deviceData, description, city, address, contacts } = req.body;
  console.log({ name, longitude, latitude, locationType, deviceData, description, city, address, contacts });
  const locpbs = new LocationPocketbaseService({ isAdmin: true });
  const result = (await locpbs.createLocation({ createData: req.body })).result! as TStatus<'location'>;
  const sr = statusTypes.get(result.statusType)!({ ...result });
  return res.status(sr.statusCode).send(sr);
};

export const updateLocationHandler = async (req: Request, res: Response) => {
  const { value } = req.body;
  console.log(isValidDate(value));
  const sr = statusTypes.get('OK')!({ message: 'Update location not yet implemented' });
  return res.status(sr.statusCode).send(sr);
};

export const deleteLocationHandler = async (req: Request, res: Response) => {
  const sr = statusTypes.get('OK')!({ message: 'Delete location not yet implemented' });
  return res.status(sr.statusCode).send(sr);
};

export const getNearestCitiesHandler = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) ? parseInt(req.query.limit as string, 10) : 10;
  const lat = parseInt(req.query.lat as string, 10) ? parseInt(req.query.lat as string, 10) : 1;
  const lng = parseInt(req.query.lng as string, 10) ? parseInt(req.query.lng as string, 10) : 1;
  const { cities } = findClosestCities({ lat, lng }, limit);
  const sr = statusTypes.get('OK')!<'cities'>({
    message: 'Nearest cities to location',
    data: {
      cities,
      meta: { lat, lng, limit },
    },
  });
  return res.status(sr.statusCode).send(sr);
};

export const fixCityData = async (req: Request, res: Response) => {
  // for (let i = 0; i < spanishCities.length; i++) {
  //   const scity = spanishCities[i];
  //   const toUpdate = await db.query.city.findFirst({where: ({country_name, latitude, longitude, name}) => })

  // }
  const result = await db
    .delete(city)
    .where(and(eq(city.country_name, 'Spain'), eq(city.latitude, 0), eq(city.longitude, 0)));
  // const jsonLength = spanishCities.length;
  // const results = await db.query.city.findMany({
  //   where: ({ country_name, longitude, latitude }, { eq, and }) =>
  //     and(eq(country_name, 'Spain'), eq(latitude, 0), eq(longitude, 0)),
  //   columns: {
  //     state_id: true,
  //     state_name: true,
  //     state_code: true,
  //     country_code: true,
  //     country_id: true,
  //     country_name: true,
  //   },
  // });
  // const ids = results.map((o) => o.state_id);
  // const filtered = results.filter(({ state_id }, index) => !ids.includes(state_id, index + 1));
  // // const set = Array.from(new Set(results));
  const sr = statusTypes.get('OK')!<'result'>({
    data: { result },
  });
  return res.status(sr.statusCode).send(sr);
};
