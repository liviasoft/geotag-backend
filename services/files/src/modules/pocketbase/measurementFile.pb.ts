import { RecordOptions } from '@neoncoder/pocketbase';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { getPocketBase } from '../../lib/pocketbase';
import { MeasurementFile } from '../../lib/pocketbase.types';
import PBService from './common.pb';

export class MeasurementFilePocketbaseService extends PBService<
  'measurementFile' | 'measurementFiles',
  MeasurementFile
> {
  measurementFile: MeasurementFile | null;
  fields = ['id', 'file', 'fileName', 'fileDeviceUrl', 'timeStamp', 'location', 'created', 'updated'];
  constructor({
    isAdmin = false,
    measurementFile,
  }: {
    isAdmin?: boolean;
    measurementFile?: MeasurementFile;
    token?: string;
  }) {
    const pocketbaseInstance = isAdmin ? getPocketBase(isAdmin) : undefined;
    super('measurementFiles', pocketbaseInstance);
    this.measurementFile = measurementFile ?? null;
  }

  async createMeasurementFile({
    createData,
    options,
  }: {
    createData: Partial<MeasurementFile>;
    options?: RecordOptions;
  }) {
    const data = this.sanitize<MeasurementFile>(this.fields, createData);
    try {
      this.measurementFile = await this.create<MeasurementFile>({ data, options });
      this.result = statusTMap.get('OK')!<'measurementFile', MeasurementFile>({
        data: { measurementFile: this.measurementFile, meta: { ...this.requestMeta(options) } },
        message: 'MeasurementFile Created Successfully',
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findMeasurementFileById({ id, options }: { id: string; options?: RecordOptions }) {
    try {
      this.measurementFile = await this.getOne<MeasurementFile>({ id, options });
      this.result = statusTMap.get('OK')!<'measurementFile', MeasurementFile>({
        data: { measurementFile: this.measurementFile, meta: { ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async updateMeasurementFile({
    updateData,
    options,
  }: {
    updateData: Partial<MeasurementFile>;
    options?: RecordOptions;
  }) {
    const data = this.sanitize<MeasurementFile>(this.fields, updateData);
    console.log(data, updateData);
    try {
      this.assertMeasurementFileExists();
      this.measurementFile = await this.update<MeasurementFile>({ id: this.measurementFile.id, data, options });
      this.result = statusTMap.get('OK')!<'measurementFile', MeasurementFile>({
        data: { measurementFile: this.measurementFile, meta: { ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      console.log({ error });
      this.formatError(error);
    }
    return this;
  }

  private assertMeasurementFileExists(): asserts this is this & { measurementFile: MeasurementFile } {
    if (!this.measurementFile || !this.measurementFile.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }
}
