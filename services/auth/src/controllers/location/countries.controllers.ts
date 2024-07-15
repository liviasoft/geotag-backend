import { db } from '@neoncoder/geolocation-data';
import { statusTypes } from '@neoncoder/typed-service-response';
import { NextFunction, Request, Response } from 'express';

export const getCountriesHandler = async (req: Request, res: Response) => {
  const results = await db.query.country.findMany({});
  const sr = statusTypes.get('OK')!({ data: { countries: results } });
  return res.status(sr.statusCode).send(sr);
};

export const getStatesHandler = async (req: Request, res: Response) => {
  const { countryId } = req.params;
  const results = await db.query.state.findMany({ where: (state, { eq }) => eq(state.country_id, Number(countryId)) });
  const sr = statusTypes.get('OK')!({ data: { states: results } });
  return res.status(sr.statusCode).send(sr);
};

export const getCitiesHandler = async (req: Request, res: Response) => {
  const { stateId, countryId } = req.params;
  const results = await db.query.city.findMany({
    where: (city, { eq, and }) => and(eq(city.country_id, Number(countryId)), eq(city.state_id, Number(stateId))),
  });
  const sr = statusTypes.get('OK')!({ data: { cities: results } });
  return res.status(sr.statusCode).send(sr);
};

export const createCityHandler = async (req: Request, res: Response) => {
  const { country: c } = req.query;
  const country = c ? String(c) : 'NG';
  const results = await db.query.state.findMany({ where: (state, { eq }) => eq(state.country_code, country) });
  const sr = statusTypes.get('OK')!({ data: { states: results } });
  return res.status(sr.statusCode).send(sr);
};

export const countryExists = async (_: Request, res: Response, next: NextFunction, countryId: string) => {
  const result = await db.query.country.findFirst({ where: (country, { eq }) => eq(country.id, Number(countryId)) });
  if (!result) {
    const sr = statusTypes.get('NotFound')!({});
    return res.status(sr.statusCode).send(sr);
  }
  res.locals.country = result;
  return next();
};

export const stateExists = async (_: Request, res: Response, next: NextFunction, stateId: string) => {
  const result = await db.query.state.findFirst({ where: (state, { eq }) => eq(state.id, Number(stateId)) });
  if (!result) {
    const sr = statusTypes.get('NotFound')!({});
    return res.status(sr.statusCode).send(sr);
  }
  res.locals.state = result;
  return next();
};

export const cityExists = async (_: Request, res: Response, next: NextFunction, cityId: string) => {
  const result = await db.query.city.findFirst({ where: (city, { eq }) => eq(city.id, Number(cityId)) });
  if (!result) {
    const sr = statusTypes.get('NotFound')!({});
    return res.status(sr.statusCode).send(sr);
  }
  res.locals.city = result;
  return next();
};
