import BullQueue, { Job, JobOptions } from 'bull';
import { config } from '../../config/config';
import { Location, Measurement, MeasurementMetadata, Point, Trace } from '@prisma/client';
// import fs from 'fs';
import {
  addToTrace,
  downloadDeviceFile,
  extractFileMetadata,
  getMostRecentMetadata,
  getUnprocessedDeviceFiles,
  saveMeasurement,
  saveMetadata,
  saveTrace,
  saveTracePoints,
  testDeviceConnection,
} from './utils';
import { DeviceFile } from '../../utils/helpers/custom.types';
import { TStatus } from '@neoncoder/typed-service-response';
import { LocationPostgresService } from '../../modules/postgres/location.pg';
import { MeasurementFile } from '../../lib/pocketbase.types';
import { getRawPocketBase } from '../../lib/pocketbase';
import axios from 'axios';
import CacheService from '../../modules/cache';
import { getPrismaClient } from '../../lib/prisma';

export const deviceConnectionQueue = new BullQueue(`${config.appName}:${config.self.name}:deviceConnect`, {
  redis: config.redis.url,
});

export const deviceInspectionQueue = new BullQueue(`${config.appName}:${config.self.name}:deviceInspect`, {
  redis: config.redis.url,
});

// deviceInspectionQueue.on('completed', (job: Job, result) => {
//   console.log({ job, result });
// });

export const fileUpdateQueue = new BullQueue(`${config.appName}:${config.self.name}:fileUpdate`, {
  redis: config.redis.url,
});

export const fileCheckQueue = new BullQueue(`${config.appName}:${config.self.name}:fileCheck`, {
  redis: config.redis.url,
});

export const fileStorageQueue = new BullQueue(`${config.appName}:${config.self.name}:fileStorage`, {
  redis: config.redis.url,
});

export const fileProcessingQueue = new BullQueue(`${config.appName}:${config.self.name}:fileProcessing`, {
  redis: config.redis.url,
});

export const signalStorageQueue = new BullQueue(`${config.appName}:${config.self.name}:signalStorage`, {
  redis: config.redis.url,
});

export const addToSignalStorageQueue = async (
  lines: string[],
  file: MeasurementFile,
  meta: SignalMeta,
  options: JobOptions = {},
) => {
  await signalStorageQueue.add('store-file-signals', { lines, file, meta }, options);
};

export const addToDeviceQueue = async (device: Location, options: JobOptions = {}) => {
  await deviceInspectionQueue.add('inspect-device-files', device, options);
};

export const addToFileCheckQueue = async (deviceId: string, ipAddress: string, options: JobOptions = {}) => {
  await fileCheckQueue.add('check-device-files', { deviceId, ipAddress }, options);
};

export const addToFileUpdateQueue = async (fileId: string, signalMeta: SignalMeta, options: JobOptions = {}) => {
  await fileUpdateQueue.add('update-file-metadata', { signalMeta, fileId }, options);
};

export const addToFileStorageQueue = async (
  deviceFileData: { deviceId: string } & DeviceFile,
  options: JobOptions = {},
) => {
  await fileStorageQueue.add('download-measurement-file', deviceFileData, options);
};

export const addToFileProcessingQueue = async (
  deviceId: string,
  deviceFile: DeviceFile,
  measurementFile: MeasurementFile,
  options: JobOptions = {},
) => {
  await fileProcessingQueue.add('process-measurement-file', { deviceId, deviceFile, measurementFile }, options);
};

const inspectDeviceFiles = async (job: Job) => {
  job.log('Begin: Inspecting Device');
  const {
    id: deviceId,
    deviceData: { ipAddress },
  } = job.data;
  job.log('Testing Device Connection');
  const connTestResult = await testDeviceConnection(deviceId);
  if (connTestResult) {
    job.log('Device Connection Confirmed - Moving to File Check Queue');
    addToFileCheckQueue(deviceId, ipAddress);
    job.moveToCompleted();
    return { deviceId, ipAddress, connected: connTestResult };
  }
  job.log('Device Connection Failed');
  return false;
  // await job.moveToCompleted();
  // await job.remove();
};

const downloadMeasurementFile = async (job: Job) => {
  job.log('Begin: Download Measurement File');
  const { deviceId, ...deviceFile } = job.data;
  job.log(`Downloading file: ${deviceFile.fileName}`);
  const newMF = await downloadDeviceFile(deviceId, deviceFile);
  if (newMF) {
    job.log(`File Downloaded: ${deviceFile.fileName}`);
    job.moveToCompleted();
    addToFileProcessingQueue(deviceId, deviceFile, newMF as unknown as MeasurementFile);
    return true;
  }
  return false;
};

const checkDeviceFiles = async (job: Job) => {
  job.log('Begin: Decking Device Files');
  const { deviceId, ipAddress } = job.data;
  const newFiles = await getUnprocessedDeviceFiles(deviceId, ipAddress);
  job.log(`New Files Found: ${newFiles.length}`);
  newFiles.forEach((file) => {
    addToFileStorageQueue({ deviceId, ...file });
  });
  return newFiles.length;
};

const checkConnectedDevices = async () => {
  console.log('Begin: Processing Measurement Files');
  const result = (
    await new LocationPostgresService({}).getFullList({
      filters: { locationTypeData: { name: { contains: 'Device', mode: 'insensitive' } } },
    })
  ).result! as TStatus<'locations', Location>;
  if (result && result?.data && result?.data?.locations) {
    const locations = result.data.locations as Location[];
    locations.forEach((location) => {
      addToDeviceQueue(location);
    });
  }
  return result?.data?.locations || [];
};

export type SignalMeta = {
  metadata?: MeasurementMetadata;
  measurements?: Measurement[];
};

const processMeasurementFile = async (job: Job) => {
  job.log('Begin: Processing Measurement File');
  const { deviceId, measurementFile } = job.data as {
    deviceId: string;
    // deviceFile: DeviceFile;
    measurementFile: MeasurementFile;
  };
  job.log(`Processing file`);
  const cacheService = new CacheService();
  const pb = getRawPocketBase();
  job.log('Fetching Measurement File Data');
  const fileUrl = pb.getFileUrl(measurementFile, measurementFile.file);
  const { data: blob } = await axios.get(fileUrl, {
    responseType: 'blob',
    headers: { 'ngrok-skip-browser-warning': true },
  });
  const lines = blob.split('\n');
  const firstLine = lines[0];
  const signalmeta: SignalMeta = {};
  cacheService.formatKey(undefined, 'measurements');
  if (firstLine.includes('<ANRITSU>')) {
    job.log('File has Metadata');
    job.log('Saving File Metadata');
    const { measurements, metadata } = extractFileMetadata(lines, measurementFile);
    const savedMetaData = await saveMetadata({ ...metadata, device: { connect: { id: deviceId } } });
    const savedMeasurements: Measurement[] = [];
    for (let i = 0; i < measurements.length; i++) {
      const msmnt = measurements[i];
      const result = await saveMeasurement(msmnt);
      savedMeasurements.push(result);
    }
    signalmeta.metadata = savedMetaData;
    signalmeta.measurements = savedMeasurements;
    const { result }: { result?: string[] } = await cacheService.sMembers();
    if (result && result.length) {
      job.log('Updating Previous Measurement Files');
      for (let idx = 0; idx < result.length; idx++) {
        const qmfId = result[idx];
        addToFileUpdateQueue(qmfId, signalmeta);
      }
    }
  } else {
    job.log('File does not have Metadata');
    job.log('Using most recent Metadata');
    const existingMetadata = await getMostRecentMetadata(deviceId);
    signalmeta.measurements = existingMetadata?.measurements;
    signalmeta.metadata = existingMetadata ?? undefined;
  }
  if (!signalmeta.metadata) {
    // Store reference to measurementFileId in cache
    job.log('No recent Metadata. No new Metadata: Caching file to update later');
    await cacheService.sAdd([measurementFile.id]);
  }
  job.log('Adding to Signal Storage Queue');
  addToSignalStorageQueue(lines, measurementFile, signalmeta);

  job.log('Job Complete');
  return true;
};

const updateFileMetadata = async (job: Job) => {
  const cs = new CacheService().formatKey(undefined, 'measurements');
  job.log('Begin: Updating File Metadata');
  const { signalMeta, fileId }: { fileId: string; signalMeta: SignalMeta } = job.data;
  const prisma = getPrismaClient();
  job.log(`Getting measurement file to update with id: ${fileId}`);
  const file = await prisma.measurementFile.findUnique({
    where: { id: fileId },
    include: { metadata: { include: { measurements: true } }, _count: { select: { points: true, traces: true } } },
  });
  if (!file) {
    job.log(`Measurement file not found - id: ${fileId}`);
    await cs.sRem([fileId]);
    return true;
  }
  if (file.metadataId) {
    job.log(`File already has metadata`);
    if (file.metadata && file.metadata?.measurements) {
      job.log(`File already has measurements: ${file.metadata.measurements.length}`);
      await cs.sRem([fileId]);
      return true;
    }
  }
  if (signalMeta?.metadata?.id) {
    job.log(`Updating File and File Traces with metadataId`);
    await prisma.measurementFile.update({ where: { id: fileId }, data: { metadataId: signalMeta.metadata.id } });
    await prisma.trace.updateMany({
      where: { AND: [{ measurementMetadataId: { equals: null } }, { measurementFileId: fileId }] },
      data: { measurementMetadataId: signalMeta.metadata.id },
    });
  }
  if (!signalMeta.measurements) {
    job.log(`Signal Metadata has no measurements`);
    await cs.sRem([fileId]);
    return true;
  }
  const traces = await prisma.trace.findMany({
    where: { AND: [{ measurementFileId: fileId }, { measurementMetadataId: signalMeta?.metadata?.id }] },
    orderBy: { updated: 'asc' },
  });
  if (!traces.length) {
    job.log(`File has no trace measurements`);
    await cs.sRem([fileId]);
    return true;
  }
  const traceIds: string[] = traces.map(({ id }) => id);

  if (signalMeta.measurements.length === 1) {
    job.log(`Updating all traces with sigle measurement id`);
    await prisma.trace.updateMany({
      where: { id: { in: traceIds } },
      data: { measurementId: signalMeta.measurements[0].id },
    });
    await cs.sRem([fileId]);
    return true;
  }
  if (signalMeta.measurements.length > 1) {
    job.log(`Traces belong to multiple measurements`);
    const parts: string[][] = [];
    let lastCutIndex = 0;
    traces.forEach((t, i) => {
      if (t.name === 'ISO_RESULT_1') {
        parts.push([...traceIds].slice(lastCutIndex, i));
        lastCutIndex = i;
      }
    });
    // const promises: any[] = []
    job.log(`Updating traces with metadata measurements`);
    await Promise.all(
      parts
        .filter((list) => Boolean(list.length))
        .map((ids, i) => {
          const measurements = signalMeta.measurements ?? [];
          if (measurements[i]) {
            return prisma.trace.updateMany({
              where: { id: { in: ids } },
              data: { measurementId: measurements[i].id },
            });
          }
        }),
    );
    await cs.sRem([fileId]);
    return true;
  }
  job.log(`Job Complete`);
  await cs.sRem([fileId]);
  return true;
};

const storeFileSignals = async (job: Job) => {
  job.log(`Begin: Storing File Signals`);
  const { lines, file, meta }: { lines: string[]; file: MeasurementFile; meta: SignalMeta } = job.data;
  let name: string = '';
  let trace: Trace | null = null;
  let measurementId: string | null = null;
  const points: Omit<Point, 'traceId' | 'measurementFileId'>[] = [];
  let measurementIndex = 0;
  job.log(`Parsing Lines: ${lines.length}`);
  for (const line of lines) {
    if (line.includes('<') && !line.startsWith('</') && line.includes('_')) {
      name = line.replace(/[<>]/g, '');
      job.log(`Trace Start: ${name}`);
      const nameParts = line.split('_').map((x) => x.replace(/[<>]/g, ''));
      if (Number(nameParts[nameParts.length - 1]) === 1 && name.startsWith('ISO_RESULT')) {
        if (meta?.measurements && meta?.measurements?.length) {
          if (meta.measurements[measurementIndex]) {
            measurementId = meta.measurements[measurementIndex].id;
            job.log(`New Measurement with Id: ${measurementId}`);
            measurementIndex += 1;
          }
        }
      }
      const traceData = {
        name,
        measurementFileId: file.id,
        measurementMetadataId: meta?.metadata?.id,
        measurementId: measurementId ?? null,
      };
      job.log(`Saving Trace: ${name}`);
      trace = await saveTrace(traceData);
      continue;
    }
    if (line.startsWith('P_')) {
      const newPoint = addToTrace(line);
      if (newPoint) points.push(newPoint);
      continue;
    }
    if (line.startsWith('</') && !line.includes('ANRITSU')) {
      job.log(`Trace End. Updating Trace: ${name}`);
      if (trace) {
        await saveTracePoints(points, trace.id, file.id);
      }
    }
  }
  job.log(`Finished Parsing Lines: ${lines.length}`);
  job.log('Job Complete');
  return true;
};

deviceInspectionQueue.process('inspect-device-files', inspectDeviceFiles);

deviceConnectionQueue.process('check-connected-devices', checkConnectedDevices);

fileCheckQueue.process('check-device-files', checkDeviceFiles);

fileStorageQueue.process('download-measurement-file', downloadMeasurementFile);

fileProcessingQueue.process('process-measurement-file', processMeasurementFile);

fileUpdateQueue.process('update-file-metadata', updateFileMetadata);

signalStorageQueue.process('store-file-signals', storeFileSignals);
