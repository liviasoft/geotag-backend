import { Prisma, LocationNote, MeasurementFile, Location, User } from '@prisma/client';
import { PostgresDBService, TPagination } from './common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { isValidDate } from '@neoncoder/validator-utils';

export type TLocationNoteWithIncludes = LocationNote & {
  measurementFileData?: MeasurementFile;
  locationData?: Location;
  authorData?: User;
};

export type TLocationNoteFilters = {
  filters?: Prisma.LocationNoteWhereInput;
  orderBy?: Prisma.LocationNoteOrderByWithRelationInput | Prisma.LocationNoteOrderByWithRelationInput[];
  include?: Prisma.LocationNoteInclude;
  exclude?: Array<keyof LocationNote>;
};

export class LocationNotePostgresService extends PostgresDBService<'locationNote' | 'locationNotes', LocationNote> {
  locationNote: LocationNote | null;
  fields = [
    'id',
    'note',
    'isSystemNote',
    'author',
    'location',
    'measurementFile',
    'type',
    'details',
    'created',
    'updated',
  ];

  constructor({ softDelete = false, locationNote = undefined }: { softDelete?: boolean; locationNote?: LocationNote }) {
    super({ softDelete });
    this.locationNote = locationNote ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TLocationNoteFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include: this.getIncludes(include),
      };
      const [locationNotes, total] = await this.prisma.$transaction([
        this.prisma.locationNote.findMany({ ...q }),
        this.prisma.locationNote.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'locationNotes', LocationNote>({
        data: { locationNotes, meta: { filters, orderBy, page, limit, total, pages, prev, next, include } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TLocationNoteFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include: this.getIncludes(include) };
      const [locationNotes, total] = await this.prisma.$transaction([
        this.prisma.locationNote.findMany({ ...q }),
        this.prisma.locationNote.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'locationNotes', LocationNote>({
        data: { locationNotes, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.LocationNoteInclude }): Promise<this> {
    try {
      const q = { where: { id }, include: this.getIncludes(include) };
      this.locationNote = await this.prisma.locationNote.findUnique({ ...q });
      this.result = this.locationNote
        ? statusTMap.get('OK')!<'locationNote', LocationNote>({
            data: { locationNote: this.locationNote, meta: { filters: q.where, include } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TLocationNoteFilters) {
    try {
      const locationNote = await this.prisma.locationNote.findFirst({ where: { ...filters }, include, orderBy });
      this.result = locationNote
        ? statusTMap.get('OK')!<'locationNote', LocationNote>({
            data: { locationNote, meta: { filters, include, orderBy } },
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

  async create(createData: Partial<LocationNote>, include?: Prisma.LocationNoteInclude): Promise<this> {
    const data = this.sanitize<LocationNote>(this.fields, createData);
    try {
      this.locationNote = await this.prisma.locationNote.create({
        data: { ...(data as Prisma.LocationNoteCreateInput) },
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('Created')!({ data: { locationNote: this.locationNote } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<LocationNote>, include?: Prisma.LocationNoteInclude): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertLocationNoteExists();
      const id = this.locationNote.id;
      this.locationNote = await this.prisma.locationNote.update({
        where: { id },
        data,
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('OK')!<'locationNote', LocationNote>({
        message: 'App setting updated',
        data: { locationNote: this.locationNote },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertLocationNoteExists();
      const id = this.locationNote.id;
      const deletedLocationNote = await this.prisma.locationNote.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedLocationNote, recoverable: this.softDelete } },
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

  private assertLocationNoteExists(): asserts this is this & { locationNote: LocationNote } {
    if (!this.locationNote || !this.locationNote.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  private unset() {
    this.locationNote = null;
  }

  private getIncludes(include?: Prisma.LocationNoteInclude) {
    const countInclude: Prisma.LocationNoteInclude = {};
    return { ...include, ...countInclude };
  }

  buildQueryFilters(query: any) {
    const OR: { [key: string]: any }[] = [];
    for (const key in query) {
      if (![...this.fields, 'created', 'updated'].includes(key)) continue;
      if (key === 'q') continue;
      if (['true', 'false'].includes(String(query[key]))) {
        OR.push({ [key]: String(query[key]) === 'true' });
        continue;
      }
      if (key === 'author' || key === 'location' || key === 'measurementFile' || key === 'type') {
        OR.push({ [key]: String(query[key]) });
        continue;
      }
      if (['created', 'updated'].includes(key)) {
        const data = String(query[key]);
        const bf = data.charAt(0) === '-';
        if (isValidDate(bf ? data.substring(1) : data)) {
          bf ? OR.push({ [key]: { lte: new Date(data.substring(1)) } }) : OR.push({ [key]: { gte: new Date(data) } });
          continue;
        }
      }
      OR.push({ [key]: query[key] });
    }
    return OR;
  }
}
