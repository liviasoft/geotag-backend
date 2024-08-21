import { Prisma, MeasurementFile, Location, LocationNote, Trace, Point, MeasurementMetadata } from '@prisma/client';
import { PostgresDBService, TPagination } from './common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';

export type TMeasurementFileWithIncludes = MeasurementFile & {
  notes: LocationNote[];
  locationData: Location;
  traces: Trace[];
  points: Point[];
  metadata?: MeasurementMetadata;
  _count?: {
    traces?: number;
    points?: number;
    notes?: number;
  };
};

export type TMeasurementFileFilters = {
  filters?: Prisma.MeasurementFileWhereInput;
  orderBy?: Prisma.MeasurementFileOrderByWithRelationInput | Prisma.MeasurementFileOrderByWithRelationInput[];
  include?: Prisma.MeasurementFileInclude;
  exclude?: Array<keyof MeasurementFile>;
};

export class MeasurementFilePostgresService extends PostgresDBService<
  'measurementFile' | 'measurementFiles',
  MeasurementFile
> {
  measurementFile: MeasurementFile | null;
  fields = ['id', 'file', 'fileName', 'fileUrl', 'fileDeviceUrl', 'timeStamp', 'location', 'created', 'updated'];

  constructor({
    softDelete = false,
    measurementFile = undefined,
  }: {
    softDelete?: boolean;
    measurementFile?: MeasurementFile;
  }) {
    super({ softDelete });
    this.measurementFile = measurementFile ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TMeasurementFileFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include: this.getIncludes(include),
      };
      const [measurementFiles, total] = await this.prisma.$transaction([
        this.prisma.measurementFile.findMany({ ...q }),
        this.prisma.measurementFile.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'measurementFiles', MeasurementFile>({
        data: { measurementFiles, meta: { filters, orderBy, page, limit, total, pages, prev, next, include } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TMeasurementFileFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include: this.getIncludes(include) };
      const [measurementFiles, total] = await this.prisma.$transaction([
        this.prisma.measurementFile.findMany({ ...q }),
        this.prisma.measurementFile.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'measurementFiles', MeasurementFile>({
        data: { measurementFiles, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.MeasurementFileInclude }): Promise<this> {
    try {
      const q = { where: { id }, include: this.getIncludes(include) };
      this.measurementFile = await this.prisma.measurementFile.findUnique({ ...q });
      this.result = this.measurementFile
        ? statusTMap.get('OK')!<'measurementFile', MeasurementFile>({
            data: { measurementFile: this.measurementFile, meta: { filters: q.where, include } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TMeasurementFileFilters) {
    try {
      const measurementFile = await this.prisma.measurementFile.findFirst({ where: { ...filters }, include, orderBy });
      this.result = measurementFile
        ? statusTMap.get('OK')!<'measurementFile', MeasurementFile>({
            data: { measurementFile, meta: { filters, include, orderBy } },
          })
        : statusTMap.get('NotFound')!({ data: { meta: filters, include, orderBy } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async search(): Promise<this> {
    return this;
  }

  async create(createData: Partial<MeasurementFile>, include?: Prisma.MeasurementFileInclude): Promise<this> {
    const data = this.sanitize<MeasurementFile>(this.fields, createData);
    try {
      this.measurementFile = await this.prisma.measurementFile.create({
        data: { ...(data as Prisma.MeasurementFileCreateInput) },
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('Created')!({ data: { measurementFile: this.measurementFile } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<MeasurementFile>, include?: Prisma.MeasurementFileInclude): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertMeasurementFileExists();
      const id = this.measurementFile.id;
      this.measurementFile = await this.prisma.measurementFile.update({
        where: { id },
        data,
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('OK')!<'measurementFile', MeasurementFile>({
        message: 'App setting updated',
        data: { measurementFile: this.measurementFile },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertMeasurementFileExists();
      const id = this.measurementFile.id;
      const deletedMeasurementFile = await this.prisma.measurementFile.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedMeasurementFile, recoverable: this.softDelete } },
      });
      this.unset();
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async batchCreate(): Promise<this> {
    console.log('Not yet implemented');
    return this;
  }

  async batchDelete(): Promise<this> {
    console.log('Not yet implemented');
    return this;
  }

  async batchUpdate(): Promise<this> {
    console.log('Not yet implemented');
    return this;
  }

  private assertMeasurementFileExists(): asserts this is this & { measurementFile: MeasurementFile } {
    if (!this.measurementFile || !this.measurementFile.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  private unset() {
    this.measurementFile = null;
  }

  private getIncludes(include?: Prisma.MeasurementFileInclude) {
    const countInclude: Prisma.MeasurementFileInclude = {
      _count: {
        select: {
          notes: true,
          points: true,
          traces: true,
        },
      },
    };
    return { ...include, ...countInclude };
  }
}
