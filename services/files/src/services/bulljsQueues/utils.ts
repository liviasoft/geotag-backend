import axios from 'axios';
// import fs from 'fs';
// import http from 'http';
// import path from 'path';
// import FormData from 'form-data';
import { Location, MeasurementFile } from '../../lib/pocketbase.types';
import { sendTCPMessage } from '../../lib/tcpClient';
import { LocationPocketbaseService } from '../../modules/pocketbase/location.pb';
import { LocationNotePocketbaseService } from '../../modules/pocketbase/locationNotes.pb';
import { extractAttrFromHTML } from '../../utils/helpers/serializers';
import { MeasurementFilePostgresService } from '../../modules/postgres/measurementFile.pg';
import { TStatus } from '@neoncoder/typed-service-response';
import { DeviceFile } from '../../utils/helpers/custom.types';
// import { MeasurementFilePocketbaseService } from '../../modules/pocketbase/measurementFile.pb';
import { getRawPocketBase } from '../../lib/pocketbase';
import { config } from '../../config/config';
import {
  Measurement,
  MeasurementMetadata,
  Point,
  Prisma,
  Trace,
  Location as PrismaLocation,
  MeasurementFile as PrismaMeasurementFile,
} from '@prisma/client';
import { isValidDate } from '@neoncoder/validator-utils';
import { Decimal } from '@prisma/client/runtime/library';
import { getPrismaClient } from '../../lib/prisma';
import { LocationNotePostgresService } from '../../modules/postgres/locationNotes.pg';
import { LocationPostgresService } from '../../modules/postgres/location.pg';

export const testDeviceConnection = async (deviceId: string): Promise<boolean> => {
  const locpbs = await new LocationPocketbaseService({ isAdmin: true }).adminAuth();
  await locpbs.findLocationById({ id: deviceId });
  const { id, name, deviceData, useRemoteConnection, remoteTCPUrl } = locpbs.location as Location;
  const locNotepbs = await new LocationNotePocketbaseService({ isAdmin: true }).adminAuth();
  const locNotepgs = new LocationNotePostgresService({});
  const { data } = (
    await locNotepgs.findFirst({
      filters: { location: deviceId },
      orderBy: { created: 'desc' },
      include: { locationData: true },
    })
  ).result! as TStatus<'locationNote'>;
  const note = `Error connecting to device: ${name}`;
  const type = 'ERROR';
  try {
    const { ipAddress: host, port } = deviceData;

    let remoteHost = host,
      remotePort = port;
    if (remoteTCPUrl && useRemoteConnection) {
      const hostPort = remoteTCPUrl.replace('//', '').split(':');
      remoteHost = hostPort[1];
      remotePort = Number(hostPort[2]);
    }
    const testResult = await sendTCPMessage(remoteHost, remotePort, '*IDN?');
    await locpbs.updateLocation({
      updateData: { connectionStatus: testResult.error ? 'ERROR' : 'OK', lastConnectionStatusCheck: new Date() },
    });
    if (testResult.error) {
      if (!data || !data.locationNote || (data.locationNote.note !== note && data.locationNote.type !== type)) {
        await locNotepbs.createLocationNote({
          createData: {
            location: id,
            isSystemNote: true,
            note: `Error connecting to device: ${name}`,
            type: 'ERROR',
            details: testResult.error,
          },
        });
      }
    }
    return testResult.error ? false : true;
  } catch (error: any) {
    console.log({ error });
    await locpbs.updateLocation({
      updateData: { connectionStatus: 'ERROR', lastConnectionStatusCheck: new Date() },
    });
    if (!data || !data.locationNote || (data.locationNote.note !== note && data.locationNote.type !== type)) {
      await locNotepbs.createLocationNote({
        createData: {
          location: deviceId,
          isSystemNote: true,
          note: `Error connecting to device: ${name}`,
          type: 'ERROR',
          details: error,
        },
      });
    }
    return false;
  }
};

export const getUnprocessedDeviceFiles = async (deviceId: string, ipAddress: string) => {
  const locNotepbs = await new LocationNotePocketbaseService({ isAdmin: true }).adminAuth();
  const locNotepgs = await new LocationNotePostgresService({});
  const location = (await new LocationPostgresService({}).findById({ id: deviceId })).result!.data!
    .location! as PrismaLocation;
  const mfpgs = new MeasurementFilePostgresService({});
  try {
    const deviceUrl = location.useRemoteConnection
      ? `${location.remoteHTTPUrl}/internal/EMF`
      : `http://${ipAddress}/internal/EMF`;
    const { data: html } = await axios.get(deviceUrl);
    const hrefs: string[] = extractAttrFromHTML({ html });
    console.log({ hrefs });
    const fileFolders = hrefs.filter((_, i) => i > 0).map((y) => `${deviceUrl}/${y}`);
    const results = (await Promise.all(fileFolders.map(async (x) => await axios.get(x)))).map(({ data }) =>
      extractAttrFromHTML({ html: data }),
    );
    console.log({ fileResults: results });
    const deviceFiles: DeviceFile[] = results
      .filter((r) => r[2] !== 'ms_result.txt')
      .map((x, i) => {
        const fileName = x[1];
        const fileFolder = fileFolders[i];
        const [dateTime, milliseconds] = fileName.split('_')[1].split('.');
        const [date, time] = dateTime.split('T');
        const [yr, mnth, dy] = [date.substring(0, 4), date.substring(4, 6), date.substring(6, 8)];
        const [hr, min, sec] = [time.substring(0, 2), time.substring(2, 4), time.substring(4, 6)];
        const timeStamp = new Date(`${yr}-${mnth}-${dy} ${Number(hr) + 1}:${min}:${sec}.${milliseconds}`);
        const fileDeviceUrl = `${fileFolder}${fileName}`;
        console.log({ fileName, fileDeviceUrl, timeStamp });
        return {
          fileName,
          fileDeviceUrl,
          timeStamp,
        };
      });
    const deviceFileNames = deviceFiles.map(({ fileName }) => fileName);
    const dbFileNames = (
      (
        await mfpgs.getFullList({
          orderBy: { timeStamp: 'desc' },
          filters: { AND: [{ fileName: { in: deviceFileNames } }, { location: deviceId }] },
        })
      ).result!.data!.measurementFiles! as PrismaMeasurementFile[]
    ).map(({ fileName }) => fileName);
    const newFilesCount = deviceFileNames.length - dbFileNames.length;
    // const lastDBFile = (await mfpgs.findFirst({ orderBy: { timeStamp: 'desc' } }))
    //   .result! as TStatus<'measurementFile'>;
    // let newDeviceFiles: Array<DeviceFile> = [];
    // if (lastDBFile?.data && lastDBFile?.data?.measurementFile) {
    //   newDeviceFiles = deviceFiles.filter(
    //     (file) => new Date(file.timeStamp) > new Date(lastDBFile.data?.measurementFile?.timeStamp),
    //   );
    // } else {
    //   newDeviceFiles = deviceFiles;
    // }
    let newDeviceFiles: Array<DeviceFile> = [];
    if (newFilesCount) {
      const fileNameObject: { [key: string]: string } = {};
      for (let i = 0; i < dbFileNames.length; i++) {
        if (!fileNameObject[dbFileNames[i]]) {
          fileNameObject[dbFileNames[i]] = dbFileNames[i];
        }
      }
      newDeviceFiles = deviceFiles.filter((file) => !fileNameObject[file.fileName]);
    } else if (!dbFileNames.length) {
      newDeviceFiles = deviceFiles;
    } else {
      newDeviceFiles = [];
    }
    const result = (await locNotepgs.findFirst({ filters: { id: deviceId }, orderBy: { created: 'desc' } }))
      .result! as TStatus<'locationNote'>;
    const note = `${newDeviceFiles.length} new measurement files found on device`;
    const type = 'INFO';
    if (
      !result.data ||
      !result.data.locationNote ||
      (result.data.locationNote.type !== type && result.data.locationNote.note !== note)
    ) {
      await locNotepbs.createLocationNote({
        createData: {
          isSystemNote: true,
          type,
          details: newDeviceFiles,
          location: deviceId,
          note,
        },
      });
    }
    return newDeviceFiles;
  } catch (error) {
    console.log({ error });
    const result = (await locNotepgs.findFirst({ filters: { id: deviceId }, orderBy: { created: 'desc' } }))
      .result! as TStatus<'locationNote'>;
    const note = `Error getting new files from device`;
    const type = 'ERROR';
    if (
      !result.data ||
      !result.data.locationNote ||
      (result.data.locationNote.type !== type && result.data.locationNote.note !== note)
    ) {
      await locNotepbs.createLocationNote({
        createData: {
          isSystemNote: true,
          type,
          details: error,
          location: deviceId,
          note,
        },
      });
    }
    return [];
  }
};

export const downloadDeviceFile = async (deviceId: string, deviceFile: DeviceFile) => {
  const locNotepbs = await new LocationNotePocketbaseService({ isAdmin: true }).adminAuth();
  const mfpgs = new MeasurementFilePostgresService({});
  const { result: check } = await mfpgs.findFirst({
    filters: { fileName: deviceFile.fileName, fileDeviceUrl: deviceFile.fileDeviceUrl },
  });
  if (check?.data?.measurementFile) {
    console.log('Already Previously Downloaded');
    return false;
  }
  // const mfpbs = await new MeasurementFilePocketbaseService({ isAdmin: true }).adminAuth();
  const rawPB = getRawPocketBase();
  await rawPB.admins.authWithPassword(config.pocketbase.adminEmail, config.pocketbase.adminPassword);
  try {
    const formData = new FormData();
    const { data: blob } = await axios.get(deviceFile.fileDeviceUrl, { responseType: 'blob' });
    // const fileDestination = path.join(`${__dirname}`, `../../../files/${deviceFile.fileName}`);
    // const file = fs.createWriteStream(fileDestination);
    // const file = fs.writeFileSync(fileDestination, blob);
    formData.append('file', new Blob([blob]), deviceFile.fileName);
    formData.append('location', deviceId);
    formData.append('fileName', deviceFile.fileName);
    formData.append('timeStamp', String(deviceFile.timeStamp));
    formData.append('fileDeviceUrl', deviceFile.fileDeviceUrl);
    const newMF = await rawPB
      .collection('measurementFiles')
      .create(formData, { headers: { ContentType: 'multipart/form-data' } });
    await locNotepbs.createLocationNote({
      createData: {
        type: 'SUCCESS',
        details: newMF,
        isSystemNote: true,
        location: deviceId,
        note: `File Downloaded Successfully: ${deviceFile.fileName}`,
        measurementFile: newMF.id,
      },
    });
    return newMF;
    // http
    //   .get(deviceFile.fileDeviceUrl, (response) => {
    //     response.pipe(file);
    //     file.on('finish', async () => {

    //       // formData.append('file', fs.readFileSync(fileDestination));
    //       formData.append('location', deviceId);
    //       formData.append('fileName', deviceFile.fileName);
    //       formData.append('timeStamp', new Date(deviceFile.timeStamp as unknown as string));
    //       formData.append('fileDeviceUrl', deviceFile.fileDeviceUrl);
    //       const newMF = await rawPB
    //         .collection('measurementFiles')
    //         .create(formData, { headers: { ContentType: 'multipart/form-data' } });
    //         // .create(formData, { headers: { ContentType: 'application/json' } });
    //       // const newMF = await mfpbs.pb
    //       //   .collection('measurementFiles')
    //       //   .create(formData, { headers: { contentType: 'multipart/form-data' } });
    //       await locNotepbs.createLocationNote({
    //         createData: {
    //           type: 'SUCCESS',
    //           details: newMF,
    //           isSystemNote: true,
    //           location: deviceId,
    //           note: `File Downloaded Successfully: ${deviceFile.fileName}`,
    //           measurementFile: newMF.id,
    //         },
    //       });
    //     });
    //   })
    // .on('error', (err) => {
    //   fs.unlink(fileDestination, async () => {
    //     console.error('Error downloading file:', err);
    //     await locNotepbs.createLocationNote({
    //       createData: {
    //         type: 'ERROR',
    //         details: err,
    //         isSystemNote: true,
    //         location: deviceId,
    //         note: `Error Downloading File: ${deviceFile.fileName}`,
    //       },
    //     });
    //   });
    // });

    // const fileDestination = `files/${deviceFile.fileName}`;
    // const newfile = fs.createWriteStream(fileDestination);
    // http
    //    .get(deviceFile.fileDeviceUrl, (response) => {
    //      formData.append('file', response);
    //    })
  } catch (error: any) {
    console.log({ error });
    await locNotepbs.createLocationNote({
      createData: {
        type: 'ERROR',
        details: error,
        isSystemNote: true,
        location: deviceId,
        note: `Error Downloading File: ${deviceFile.fileName}`,
      },
    });
    return false;
  }
};

// TODO: Measurement Power Units Adapter

export const convertDBmVtoVM = (dbmvValue: number) => {
  return 10 ** ((dbmvValue - 60) / 20);
};

export const calculateRefEMFLimit = (freq: number) => {
  if (freq > 2000) return 61;
  return 1.375 * Math.sqrt(freq);
};

export const calculateExposureRatio = (traceVM: number, refEMFLimit: number) => {
  return (traceVM / refEMFLimit) * 100;
};

export const saveMetadata = async (data: Prisma.MeasurementMetadataCreateInput, id?: string) => {
  let metadata: MeasurementMetadata;
  const prisma = getPrismaClient();
  if (id) {
    metadata = await prisma.measurementMetadata.update({ where: { id }, data });
  } else {
    metadata = await prisma.measurementMetadata.create({ data });
  }
  return metadata;
};

export const saveMeasurement = async (data: Prisma.MeasurementCreateInput, id?: string) => {
  const prisma = getPrismaClient();
  let measurement: Measurement;
  if (id) {
    measurement = await prisma.measurement.update({ where: { id }, data });
  } else {
    measurement = await prisma.measurement.create({ data });
  }
  return measurement;
};

export const saveTrace = async (data: Prisma.TraceCreateInput, traceId?: string) => {
  let trace: Trace;
  const prisma = getPrismaClient();
  if (traceId) {
    trace = await prisma.trace.update({
      where: { id: traceId },
      data: { ...data },
    });
  } else {
    trace = await prisma.trace.create({ data: { ...data } });
  }
  return trace;
};

export const saveTracePoints = async (
  points: Omit<Point, 'traceId' | 'measurementFileId'>[],
  traceId: string,
  measurementFileId: string,
) => {
  console.log({ traceId, measurementFileId, points: points.length });
  const createData = points.map((x) => ({ ...x, measurementFileId, traceId }));
  const prisma = getPrismaClient();
  const result = await prisma.point.createMany({ data: createData, skipDuplicates: true });
  return result;
};

export const addToTrace = (line: string) => {
  if (line.startsWith('P_')) {
    const [pointNum, amplitude_DBMV, frequency_MHz] = line.split(/\s+/);
    const amplitude_VM = convertDBmVtoVM(Number(amplitude_DBMV));
    const referenceEMFLimit = calculateRefEMFLimit(Number(frequency_MHz));
    const exposureRatio = calculateExposureRatio(amplitude_VM, referenceEMFLimit);
    const pointData: Omit<Point, 'traceId' | 'measurementFileId'> = {
      pointNum: String(pointNum),
      amplitude_DBMV: new Decimal(amplitude_DBMV),
      frequency_MHz: new Decimal(frequency_MHz),
      amplitude_VM: new Decimal(amplitude_VM),
      referenceEMFLimit: new Decimal(referenceEMFLimit),
      exposureRatio: new Decimal(exposureRatio),
    };
    return pointData;
  }
  return null;
};

export const extractFileMetadata = (lines: string[], newMF: MeasurementFile) => {
  const metadata: Partial<MeasurementMetadata> = {};
  let numberOfMeasurements: number = 0;
  const measurements: Omit<Measurement, 'id' | 'measurementMetadataId' | 'created' | 'updated'>[] = [];
  for (const [index, line] of lines.entries()) {
    if (line.includes('Frequency Range')) {
      metadata.frequencyRange = line.split(':')[1].trim();
      continue;
    }
    if (line.includes('GPS Fix: timestamp')) {
      metadata.gpsTimeStamp = isValidDate(line.split('timestamp:')[1].trim())
        ? new Date(line.split('timestamp:')[1].trim())
        : new Date(newMF.timeStamp);
      continue;
    }
    if (line.includes('latitude')) {
      metadata.latitude = new Decimal(line.split(':')[1].trim());
      continue;
    }
    if (line.includes('longitude')) {
      metadata.longitude = new Decimal(line.split(':')[1].trim());
      continue;
    }
    if (line.includes('altitude')) {
      metadata.altitude = new Decimal(line.split(':')[1].trim());
      continue;
    }
    if (line.includes('number of Satellites')) {
      metadata.numberOfSatellites = Number(line.split(':')[1].trim());
      continue;
    }
    if (line.includes('Time Start')) {
      metadata.timeStart = new Date(line.split('Time Start:')[1].trim());
      continue;
    }
    if (line.includes('Measurement Time')) {
      metadata.measurementTimeInSeconds = Number(line.split(':')[1].trim());
      continue;
    }
    if (line.includes('Number of Measurement')) {
      numberOfMeasurements = Number(line.split(':')[1].trim());
      metadata.numberOfMeasurements = numberOfMeasurements;
      continue;
    }
    if (line.includes('Axis Dwell Time')) {
      metadata.axisDwellTime = Number(line.split(':')[1].trim());
      continue;
    }
    if (line.includes('Limit ')) {
      metadata.Limit = String(line.split(':')[1].trim());
      continue;
    }
    if (line.startsWith('Measurement') && Number(line.split(' ')[1].trim())) {
      // const measurementIndex = Number(line.split(' ')[1].trim());
      const valuesLine1 = lines[index + 2];
      const [avg_DBM_M2, min_DBM_M2, max_DBM_M2, time_in_seconds] = valuesLine1.split(/\s+/).filter(Boolean);
      const test_status = String(valuesLine1.split(/\s+/).filter(Boolean)[4]);
      const valuesLine2 = lines[index + 4];
      const [total_avg_DBM_M2, total_min_DBM_M2, total_max_DBM_M2, total_time_in_seconds] = valuesLine2
        .split(/\s+/)
        .filter(Boolean);
      measurements.push({
        avg_DBM_M2: new Decimal(avg_DBM_M2),
        min_DBM_M2: new Decimal(min_DBM_M2),
        max_DBM_M2: new Decimal(max_DBM_M2),
        time_in_seconds: Number(time_in_seconds),
        test_status,
        total_avg_DBM_M2: new Decimal(total_avg_DBM_M2),
        total_min_DBM_M2: new Decimal(total_min_DBM_M2),
        total_max_DBM_M2: new Decimal(total_max_DBM_M2),
        total_time_in_seconds: Number(total_time_in_seconds),
      });
      continue;
    }
    if (numberOfMeasurements && numberOfMeasurements === measurements.length) {
      return { measurements, metadata, numberOfMeasurements };
    }
  }
  return { measurements, metadata, numberOfMeasurements };
};

export const getMostRecentMetadata = async (deviceId: string) => {
  const prisma = getPrismaClient();
  const recentMetadata = await prisma.measurementMetadata.findFirst({
    where: { deviceId },
    orderBy: { created: 'desc' },
    include: {
      measurementFiles: true,
      device: true,
      _count: { select: { traces: true, measurements: true } },
      measurements: { include: { _count: { select: { traces: true } } } },
    },
  });
  return recentMetadata;
};

export const getMostRelevantMetadata = async (deviceId: string, timeStamp: Date) => {
  const prisma = getPrismaClient();
  const relevantMetadata = await prisma.measurementMetadata.findFirst({
    where: { AND: [{ deviceId }, { timeStart: { lte: timeStamp } }] },
    orderBy: { created: 'desc' },
    include: {
      measurementFiles: true,
      device: true,
      _count: { select: { traces: true, measurements: true } },
      measurements: { include: { _count: { select: { traces: true } } } },
    },
  });
  return relevantMetadata;
};

// export const parseFileContent = (content: string) => {
//   const lines = content.split('\n');
//   const parsedData = { points: [] };

//   let isIncomplete = false;
//   const inISOResults = false;

//   for (let line of lines) {
//     line = line.trim();
//     if (line.includes('Test Incomplete')) {
//       isIncomplete = true;
//       continue;
//     }
//     if (line.startsWith('Frequency Range')) {
//       parsedData.frequencyRange = line.split(':')[1].trim();
//     } else if (line.startsWith('GPS Fix: timestamp')) {
//       const parts = line.split('timestamp:')[1].split('\n');
//       parsedData.gpsFix = {
//         timestamp: parts[0].trim(),
//         latitude: parseFloat(parts[1].split(':')[1].trim()),
//         longitude: parseFloat(parts[2].split(':')[1].trim()),
//         altitude: parseFloat(parts[3].split(':')[1].trim()),
//         numberOfSatellites: parseInt(parts[4].split(':')[1].trim(), 10),
//       };
//     } else if (line.startsWith('Time Start')) {
//       parsedData.timeStart = line.split(':')[1].trim();
//     } else if (line.startsWith('Measurement Time')) {
//       parsedData.measurementTime = parseInt(line.split(':')[1].trim(), 10);
//     } else if (line.startsWith('Number of Measurement')) {
//       parsedData.numberOfMeasurement = parseInt(line.split(':')[1].trim(), 10);
//     } else if (line.startsWith('Axis Dwell Time')) {
//       parsedData.axisDwellTime = parseInt(line.split(':')[1].trim(), 10);
//     } else if (line.startsWith('Limit')) {
//       parsedData.limit = line.split(':')[1].trim();
//     } else if (line.startsWith('AVG')) {
//       const [avg, min, max, time, status] = line.split(/\s+/).filter(Boolean).map(Number);
//       parsedData.measurements = parsedData.measurements || [];
//       parsedData.measurements.push({
//         avg,
//         min,
//         max,
//         time: time || 0,
//         status: status || '--',
//       });
//     } else if (line.startsWith('<ISO_RESULT')) {
//       inIsoResults = true;
//       continue;
//     }

//     // Parsing ISO_RESULT points
//     if (inIsoResults && line.startsWith('P_')) {
//       const [pointNum, amplitude, frequency] = line.split(/\s+/).filter(Boolean).map(Number);
//       parsedData.points.push({ pointNum, amplitude, frequency });
//     }
//   }
// };
