import { city, db, findClosestCities, AND as and, EQ as eq } from '@neoncoder/geolocation-data';
import { TStatus, statusTypes } from '@neoncoder/typed-service-response';
import { NextFunction, Request, Response } from 'express';
import { LocationPocketbaseService } from '../../modules/pocketbase/locations.pb';
// import { isValidDate } from '@neoncoder/validator-utils';
import { LocationPostgresService } from '../../modules/postgres/location.pg';
import { Location, Prisma } from '@prisma/client';
import { sendScpiCommand, sendTCPMessage } from '../../lib/tcpClient';
import { LocationNote } from '../../lib/pocketbase.types';
import { getPocketBase } from '../../lib/pocketbase';
import { config } from '../../config/config';
// import { getPocketBase } from '../../lib/pocketbase';
// import { sendScpiCommand, TCPClientFactory } from '../../lib/tcpClient';
// import spanishCities from './spanishCities.json';

export const getLocationDetailsHandler = async (req: Request, res: Response) => {
  const locationId = res.locals.location.id;
  const locpgs = new LocationPostgresService({});
  const result = (
    await locpgs.findById({
      id: locationId,
      include: { _count: { select: { contacts: true } }, addedByData: true, contacts: true, locationTypeData: true },
    })
  ).result!;
  const sr = statusTypes.get(result.statusType)!({ ...result });
  return res.status(sr.statusCode).send(sr);
};

export const createLocationHandler = async (req: Request, res: Response) => {
  const { name, longitude, latitude, locationType, deviceData, description, city, address, contacts } = req.body;
  console.log({ name, longitude, latitude, locationType, deviceData, description, city, address, contacts });
  const locpbs = new LocationPocketbaseService({ isAdmin: true });
  const result = (await locpbs.createLocation({ createData: { ...req.body, addedBy: res.locals.authUserId } }))
    .result! as TStatus<'location'>;
  const sr = statusTypes.get(result.statusType)!({ ...result });
  return res.status(sr.statusCode).send(sr);
};

export const updateLocationHandler = async (req: Request, res: Response) => {
  const locpbs = new LocationPocketbaseService({ isAdmin: true, location: res.locals.location });
  if (req.body.addedBy) delete req.body.addedBy;
  const result = (await locpbs.updateLocation({ updateData: req.body })).result! as TStatus<'location'>;
  const sr = statusTypes.get(result.statusType)!({ ...result });
  return res.status(sr.statusCode).send(sr);
};

export const deleteLocationHandler = async (req: Request, res: Response) => {
  const locpbs = await new LocationPocketbaseService({ location: res.locals.location }).adminAuth();
  const result = (await locpbs.deleteLocation({})).result!;
  const sr = statusTypes.get(result?.statusType)!({ ...result });
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

export const locationExists = async (_: Request, res: Response, next: NextFunction, locationId: string) => {
  const { data } = (
    await new LocationPostgresService({}).findById({
      id: locationId,
      include: { addedByData: true, locationTypeData: true, contacts: true },
    })
  ).result! as TStatus<'location'>;
  if (data && data.location) {
    res.locals.location = data.location;
    return next();
  }
  const sr = statusTypes.get('NotFound')!({ message: 'location not found' });
  return res.status(sr.statusCode).send(sr);
};

export const testDeviceConnectionHandler = async (_: Request, res: Response) => {
  const location = res.locals.location as Location;
  const locpbs = await new LocationPocketbaseService({ isAdmin: true }).findLocationById({ id: location.id });
  if (!location.deviceData) {
    const sr = statusTypes.get('ExpectationFailed')!({ message: `This location is not a device` });
    return res.status(sr.statusCode).send(sr);
  }
  // const deviceResponse = '';
  const { ipAddress: host, port } = location.deviceData as Prisma.JsonObject as { ipAddress: string; port: number };
  const { useRemoteConnection, remoteTCPUrl } = location;
  let remoteHost = host,
    remotePort = port;
  if (remoteTCPUrl && useRemoteConnection) {
    const hostPort = remoteTCPUrl.replace('//', '').split(':');
    remoteHost = hostPort[1];
    remotePort = Number(hostPort[2]);
  }
  console.log({ host, port, remoteHost, remotePort });
  try {
    const result = await sendTCPMessage(remoteHost, remotePort, '*IDN?');
    console.log({ result });
    await locpbs.updateLocation({
      updateData: { connectionStatus: result.error ? 'ERROR' : 'OK', lastConnectionStatusCheck: new Date() },
      options: { requestKey: null },
    });
    const newLocNoteData: Partial<LocationNote> = {
      type: result.error ? 'ERROR' : 'INFO',
      isSystemNote: true,
      note: `CMD: '*IDN?', Response: '${result.error ? result.error : result.response}'`,
      location: location.id,
      author: res.locals.authUserId ?? undefined,
      details: result,
    };
    const pb = getPocketBase(true);
    await pb.admins.authWithPassword(config.pocketbase.adminEmail, config.pocketbase.adminPassword, {
      requestKey: null,
    });
    await pb.collection('locationNotes').create(newLocNoteData);
    if (result.error) {
      const sr = statusTypes.get('ServiceUnavailable')!({
        message: `Unable to connect to: ${location.name}`,
        error: result.error,
      });
      return res.status(sr.statusCode).send(sr);
    } else {
      const sr = statusTypes.get('OK')!({ message: `Connected: ${result.response}` });
      return res.status(sr.statusCode).send(sr);
    }
  } catch (error: any) {
    const sr = statusTypes.get('ServiceUnavailable')!({});
    return res.status(sr.statusCode).send(sr);
  }
};

export const sendDeviceCommandHandler = async (req: Request, res: Response) => {
  const location = res.locals.location as Location;
  // const locpbs = await new LocationPocketbaseService({ isAdmin: true }).findLocationById({ id: location.id });
  if (!location.deviceData) {
    const sr = statusTypes.get('ExpectationFailed')!({ message: `This location is not a device` });
    return res.status(sr.statusCode).send(sr);
  }
  // const deviceResponse = '';
  if (location.connectionStatus !== 'OK') {
    const sr = statusTypes.get('ExpectationFailed')!({ message: `${location.name}: Check device connection status` });
    return res.status(sr.statusCode).send(sr);
  }
  const { ipAddress: host, port } = location.deviceData as Prisma.JsonObject as { ipAddress: string; port: number };
  const { useRemoteConnection, remoteTCPUrl } = location;
  let remoteHost = host,
    remotePort = port;
  if (remoteTCPUrl && useRemoteConnection) {
    const hostPort = remoteTCPUrl.replace('//', '').split(':');
    remoteHost = hostPort[1];
    remotePort = Number(hostPort[2]);
  }
  const { command } = req.body;
  sendScpiCommand({ host: remoteHost, port: remotePort, command }, async (err, response) => {
    const newLocNoteData: Partial<LocationNote> = {
      type: err ? 'ERROR' : command.charAt(command.length - 1) !== '?' ? 'SUCCESS' : 'INFO',
      isSystemNote: true,
      note: `CMD: '${command}', Response: '${err ? err : response}'`,
      location: location.id,
      author: res.locals.authUserId ?? undefined,
      details: { err, response },
    };
    const pb = getPocketBase(true);
    await pb.admins.authWithPassword(config.pocketbase.adminEmail, config.pocketbase.adminPassword, {
      requestKey: null,
    });
    await pb.collection('locationNotes').create(newLocNoteData);
    if (err) {
      console.log({ err });
      // const result = (
      // await locpbs.updateLocation({
      //   updateData: { connectionStatus: 'ERROR', lastConnectionStatusCheck: new Date() },
      // });
      // ).result! as TStatus<'location'>;
      const sr = statusTypes.get('BadGateway')!({
        message: `Unable to connect to: ${location.name}`,
        error: err,
      });
      return res.status(sr.statusCode).send(sr);
    }
    // await locpbs.updateLocation({
    //   updateData: { connectionStatus: 'OK', lastConnectionStatusCheck: new Date() },
    // });
    const sr = statusTypes.get('OK')!({ message: `Device Response: ${response}`, data: { response } });
    return res.status(sr.statusCode).send(sr);
  });
};
