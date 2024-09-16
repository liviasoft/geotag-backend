import { statusTypes, TStatus } from '@neoncoder/typed-service-response';
import { NextFunction, Request, Response } from 'express';
import { LocationPostgresService } from '../../modules/postgres/location.pg';
import axios from 'axios';
import { extractAttrFromHTML } from '../../utils/helpers/serializers';
import { Location, Measurement, MeasurementFile, Point, Prisma, Trace } from '@prisma/client';
import {
  MeasurementFilePostgresService,
  TMeasurementFileWithIncludes,
} from '../../modules/postgres/measurementFile.pg';
import CacheService from '../../modules/cache';
import {
  addToTrace,
  extractFileMetadata,
  getMostRelevantMetadata,
  getUnprocessedDeviceFiles,
  saveMeasurement,
  saveMetadata,
  saveTrace,
  saveTracePoints,
} from '../../services/bulljsQueues/utils';
import { addToFileStorageQueue, SignalMeta } from '../../services/bulljsQueues/device.queues';
import { MeasurementFilePocketbaseService } from '../../modules/pocketbase/measurementFile.pb';
import { getPrismaClient } from '../../lib/prisma';
import { MILLISECONDS, TIME_PERIOD, WORD_TO_TIME_PERIOD, WordTimePeriodKey } from '@neoncoder/validator-utils';

export const getStoredMeasurementFilesHandler = async (req: Request, res: Response) => {
  const mfpgs = new MeasurementFilePostgresService({});
  const result = (
    await mfpgs.getFullList({
      filters: { location: res.locals.device.id },
      include: { metadata: true, locationData: true, _count: { select: { notes: true, points: true, traces: true } } },
      orderBy: { timeStamp: 'desc' },
    })
  ).result!;
  const sr = statusTypes.get(result.statusType)!({ ...result });
  return res.status(sr.statusCode).send(sr);
};

export const getDeviceMeasurementFilesHandler = async (req: Request, res: Response) => {
  const device: Location = res.locals.device;
  const { ipAddress } = device.deviceData as Prisma.JsonObject;
  if (!ipAddress) {
    const sr = statusTypes.get('ExpectationFailed')!({ message: `${device.name}: Invalid Ip Address` });
    return res.status(sr.statusCode).send(sr);
  }
  if (device.connectionStatus !== 'OK') {
    const sr = statusTypes.get('ExpectationFailed')!({ message: `${device.name}: Check device connection status` });
    return res.status(sr.statusCode).send(sr);
  }
  const { useRemoteConnection, remoteHTTPUrl } = device;
  try {
    const deviceUrl = useRemoteConnection ? `${remoteHTTPUrl}/internal/EMF` : `http://${ipAddress}/internal/EMF`;
    const { data: html } = await axios.get(deviceUrl, { headers: { 'ngrok-skip-browser-warning': true } });
    const hrefs: string[] = extractAttrFromHTML({ html });
    const fileFolders = hrefs.filter((_, i) => i > 0).map((y) => `${deviceUrl}/${y}`);
    const results = (
      await Promise.all(
        fileFolders.map(async (x) => await axios.get(x, { headers: { 'ngrok-skip-browser-warning': true } })),
      )
    ).map(({ data }) => extractAttrFromHTML({ html: data }));
    // console.log({ results });
    const files = results
      .map((x, i) => {
        const fileName = x[1];
        const fileFolder = fileFolders[i];
        const [dateTime, milliseconds] = fileName.split('_')[1].split('.');
        const [date, time] = dateTime.split('T');
        const [yr, mnth, dy] = [date.substring(0, 4), date.substring(4, 6), date.substring(6, 8)];
        const [hr, min, sec] = [time.substring(0, 2), time.substring(2, 4), time.substring(4, 6)];
        const timeStamp = new Date(`${yr}-${mnth}-${dy} ${Number(hr) + 1}:${min}:${sec}.${milliseconds}`);
        return {
          fileName,
          fileDeviceUrl: `${fileFolder}${fileName}`,
          timeStamp,
        };
      })
      .reverse();
    const filePaths = results.map((x, i) => `${fileFolders[i]}${x[1]}`);
    const sr = statusTypes.get('OK')!<'files'>({
      data: { files, meta: { deviceData: device.deviceData, count: filePaths.length } },
    });
    return res.status(sr.statusCode).send(sr);
  } catch (error: any) {
    console.log({ error });
    const sr = statusTypes.get('ServiceUnavailable')!({ error, message: 'Error connecting to device' });
    return res.status(sr.statusCode).send(sr);
  }
};

export const deviceExists = async (req: Request, res: Response, next: NextFunction, deviceId: string) => {
  const { data } = (
    await new LocationPostgresService({}).findById({
      id: deviceId,
      include: { addedByData: true, locationTypeData: true, contacts: true },
    })
  ).result! as TStatus<'location'>;
  if (data && data.location && data.location?.deviceData) {
    res.locals.device = data.location;
    return next();
  }
  const sr = statusTypes.get('NotFound')!({
    message: data?.location ? 'This location has no associated device' : 'Location not found',
  });
  return res.status(sr.statusCode).send(sr);
};

export const locationExists = async (req: Request, res: Response, next: NextFunction, locationId: string) => {
  const { data } = (
    await new LocationPostgresService({}).findById({
      id: locationId,
      include: { addedByData: true, locationTypeData: true, contacts: true },
    })
  ).result! as TStatus<'location'>;
  console.log({ data });
  if (data && data.location) {
    res.locals.location = data.location as Location;
    return next();
  }
  const sr = statusTypes.get('NotFound')!({
    message: data?.location ? 'This location has no associated device' : 'Location not found',
  });
  return res.status(sr.statusCode).send(sr);
};

export const measurementFileExists = async (req: Request, res: Response, next: NextFunction, fileId: string) => {
  const mfpgs = new MeasurementFilePostgresService({});
  const result = (await mfpgs.findById({ id: fileId })).result! as TStatus<'measurementFile'>;
  if (!result.data || !result.data.measurementFile) {
    const sr = statusTypes.get('NotFound')!({ message: 'Measurement file not found' });
    return res.status(sr.statusCode).send(sr);
  }
  res.locals.measurementFile = result.data.measurementFile as MeasurementFile;
  return next();
};

export const triggerFileProcessingHandler = async (req: Request, res: Response) => {
  const mfpgs = new MeasurementFilePostgresService({ measurementFile: res.locals.measurementFile });
  const locpgs = new LocationPostgresService({ location: res.locals.device });
  const mfpbs = await new MeasurementFilePocketbaseService({}).findMeasurementFileById({
    id: mfpgs.measurementFile!.id,
  });
  const check = (
    await mfpgs.findById({
      id: res.locals.measurementFile.id,
      include: { _count: { select: { notes: true, points: true, traces: true } }, metadata: true },
    })
  ).result!;
  const existingData = check.data?.measurementFile as TMeasurementFileWithIncludes;
  if (existingData.metadataId || existingData._count?.traces) {
    const sr = statusTypes.get('OK')!({
      message: 'File is already processed',
      data: { measurementFile: existingData },
    });
    return res.status(sr.statusCode).send(sr);
  }

  const cs = new CacheService().formatKey(undefined, 'measurements');
  try {
    const { data: blob } = await axios.get(mfpgs.measurementFile!.fileUrl, {
      responseType: 'blob',
      headers: { 'ngrok-skip-browser-warning': true },
    });
    const lines = blob.split('\n');
    const firstLine = lines[0];
    const signalmeta: SignalMeta = {};
    if (firstLine.includes('<ANRITSU>')) {
      const { measurements, metadata } = extractFileMetadata(lines, mfpbs.measurementFile!);
      const savedMetaData = await saveMetadata({ ...metadata, device: { connect: { id: locpgs.location!.id } } });
      const savedMeasurements: Measurement[] = [];
      for (let i = 0; i < measurements.length; i++) {
        const msmnt = measurements[i];
        const result = await saveMeasurement(msmnt);
        savedMeasurements.push(result);
      }
      signalmeta.metadata = savedMetaData;
      signalmeta.measurements = savedMeasurements;
    } else {
      const existingMetadata = await getMostRelevantMetadata(
        mfpgs.measurementFile!.id,
        mfpgs.measurementFile?.timeStamp ? mfpgs.measurementFile.timeStamp : mfpgs.measurementFile!.created!,
      );
      signalmeta.measurements = existingMetadata?.measurements;
      signalmeta.metadata = existingMetadata ?? undefined;
    }
    if (!signalmeta.metadata) {
      await cs.sAdd([mfpgs.measurementFile!.id]);
    }
    let name: string = '';
    let trace: Trace | null = null;
    let measurementId: string | null = null;
    const points: Omit<Point, 'traceId' | 'measurementFileId'>[] = [];
    let measurementIndex = 0;

    for (const line of lines) {
      if (line.includes('<') && !line.startsWith('</') && line.includes('_')) {
        name = line.replace(/[<>]/g, '');
        const nameParts = line.split('_').map((x: string) => x.replace(/[<>]/g, ''));
        if (Number(nameParts[nameParts.length - 1]) === 1 && name.startsWith('ISO_RESULT')) {
          if (signalmeta?.measurements && signalmeta?.measurements?.length) {
            if (signalmeta.measurements[measurementIndex]) {
              measurementId = signalmeta.measurements[measurementIndex].id;
              measurementIndex += 1;
            }
          }
        }
        const traceData = {
          name,
          measurementFileId: mfpgs.measurementFile!.id,
          measurementMetadataId: signalmeta?.metadata?.id,
          measurementId: measurementId ?? null,
        };
        trace = await saveTrace(traceData);
        continue;
      }
      if (line.startsWith('P_')) {
        if (line.startsWith('P_')) {
          const newPoint = addToTrace(line);
          if (newPoint) points.push(newPoint);
          continue;
        }
      }
      if (line.startsWith('</') && !line.includes('ANRITSU')) {
        if (trace) {
          console.log({ points, traceId: trace.id, measurementFileId: mfpgs.measurementFile!.id });
          await saveTracePoints(points, trace.id, mfpgs.measurementFile!.id);
        }
      }
    }

    const sr = statusTypes.get('OK')!({ message: 'Measurement file has been processed' });
    return res.status(sr.statusCode).send(sr);
  } catch (error: any) {
    console.log({ error });
  }
};

export const getFileSignalDataHandler = async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  const data = await prisma.trace.findMany({
    where: { measurementFileId: req.params.fileId },
    include: {
      _count: { select: { points: true } },
      measurementMetadata: true,
      measurement: true,
      measurementFile: true,
      points: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
  if (!data.length) {
    const sr = statusTypes.get('UnprocessableEntity')!({ message: 'No Trace Data - Try processing file' });
    return res.status(sr.statusCode).send(sr);
  }
  const sr = statusTypes.get('OK')!<'traces'>({ message: 'File Measurement Data Loaded', data: { traces: data } });
  return res.status(sr.statusCode).send(sr);
};

export const searchDeviceMeasurementFilesHandler = async (req: Request, res: Response) => {
  const mfpgs = new MeasurementFilePostgresService({});
  const useTimePeriod = req.query.useTimePeriod === 'true';
  console.log(req.query);
  const timePeriod: WordTimePeriodKey =
    String(req.query.timePeriod) in WORD_TO_TIME_PERIOD ? (String(req.query.timePeriod) as WordTimePeriodKey) : 'days';
  const value = Number(req.query.value ?? 1) > 0 ? Number(req.query.value ?? 1) : 1;
  const timeInSeconds = useTimePeriod ? TIME_PERIOD[WORD_TO_TIME_PERIOD[timePeriod]] * value * MILLISECONDS : 0;
  const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - timeInSeconds);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
  const result = (
    await mfpgs.getFullList({
      filters: { AND: [{ location: req.params.deviceId }, { timeStamp: { gte: from, lte: to } }] },
      include: { _count: { select: { notes: true, points: true, traces: true } }, metadata: true },
      orderBy: { timeStamp: 'desc' },
    })
  ).result!;
  const sr = statusTypes.get(result.statusType)!({ ...result });
  return res.status(sr.statusCode).send(sr);
};

export const checkDeviceForNewFilesHandler = async (req: Request, res: Response) => {
  const device: Location = res.locals.device;
  const { ipAddress } = device.deviceData as Prisma.JsonObject;
  if (!ipAddress) {
    const sr = statusTypes.get('ExpectationFailed')!({ message: `${device.name}: Invalid Ip Address` });
    return res.status(sr.statusCode).send(sr);
  }
  if (device.connectionStatus !== 'OK') {
    const sr = statusTypes.get('ExpectationFailed')!({ message: `${device.name}: Check device connection status` });
    return res.status(sr.statusCode).send(sr);
  }
  const deviceFiles = await getUnprocessedDeviceFiles(device.id, ipAddress as string);
  const sr = statusTypes.get('OK')!({
    message: `${deviceFiles.length} New Files Found on device`,
    data: { deviceFiles },
  });
  if (req.query.process) {
    deviceFiles.forEach((file) => {
      addToFileStorageQueue({ deviceId: device.id, ...file });
    });
  }
  return res.status(sr.statusCode).send(sr);
};
