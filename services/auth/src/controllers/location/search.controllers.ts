import {
  COUNT,
  city,
  cityRepository,
  country,
  countryRepository,
  db,
  state,
  stateRepository,
  // countryRepository,
  // cityRepository,
  // Country,
  // stateRepository,
} from '@neoncoder/geolocation-data';
import { Rez, TStatus, statusTypes } from '@neoncoder/typed-service-response';
// import { sortByStringProperty } from '@neoncoder/validator-utils';
import { Request, Response } from 'express';
import { getPrismaClient } from '../../lib/prisma';
import { JsonObject } from '@prisma/client/runtime/library';
import { LocationPostgresService } from '../../modules/postgres/location.pg';

export const getLocationCountsHandler = async (req: Request, res: Response) => {
  const { q } = req.query;
  console.log({ q });
  const prisma = getPrismaClient();
  if (!q) {
    const results: Array<{ name: string; type: string; value: any; [key: string]: any }> = [];
    const countries = (await db.select({ value: COUNT() }).from(country))[0].value;
    const states = (await db.select({ value: COUNT() }).from(state))[0].value;
    const cities = (await db.select({ value: COUNT() }).from(city))[0].value;
    const locations = await prisma.location.count({});
    results.push({ name: 'Cities', type: 'City', value: cities, count: cities });
    results.push({ name: 'States', type: 'State', value: states, count: states });
    results.push({ name: 'Countries', type: 'Country', value: countries, count: countries });
    results.push({ name: 'Locations', type: 'Location', value: locations, count: locations });
    const sr = statusTypes.get('OK')!({
      data: { results },
    });
    return res.status(sr.statusCode).json(results);
  }
  const search = q as string;
  const { data: countryData } = (await countryRepository.getAllCountries({
    filter: { name: search },
    include: { count: true },
  })) as unknown as { data: any[] };
  const countries = countryData.map((c) => ({
    name: c.name,
    type: 'Country',
    value: c.id,
    count: c.stateCount,
    latitude: c.latitude,
    longitude: c.longitude,
  }));
  const { data: stateData } = (await stateRepository.getAllStates({
    filter: { name: search },
    include: { count: true },
  })) as unknown as { data: any[] };
  const states = stateData.map((s) => ({
    name: s.name,
    type: 'State',
    country: s.country_name,
    value: s.id,
    count: s.cityCount,
    latitude: s.latitude,
    longitude: s.longitude,
  }));
  const { data: cityData } = await cityRepository.getAllCities({
    filter: { name: search },
  });
  const cities = cityData.map((ct) => ({
    name: ct.name,
    type: 'City',
    value: ct.id,
    state: ct.state_name,
    country: ct.country_name,
    latitude: ct.latitude,
    longitude: ct.longitude,
  }));
  const locationData = await prisma.location.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        {
          locationTypeData: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ],
    },
    include: { locationTypeData: true },
  });

  const locations = locationData.map((l) => {
    const { city } = l;
    if (city) {
      const { name: cityName, state_name: state, country_name: country } = city as JsonObject;
      return { name: l.name, type: 'Location', value: l.id, city: cityName, state, country };
    } else {
      return { name: l.name, type: 'Location', value: l.id, city: 'Unknown', state: 'Unknown', country: 'Unknown' };
    }
  });
  const sr = statusTypes.get('OK')!({ data: { results: [...cities, ...states, ...countries, ...locations] } });
  return res.status(sr.statusCode).json([...locations, ...cities, ...states, ...countries]);
};

export const getSavedLocationsHandler = async (req: Request, res: Response) => {
  const locpgs = new LocationPostgresService({});
  const result = (await locpgs.getFullList({ include: { locationTypeData: true, contacts: true } }))
    .result! as TStatus<'locations'>;
  const sr = Rez[result.statusType]!({ ...result });
  return res.status(sr.statusCode).send(sr);
};
