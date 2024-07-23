import { Prisma, Location, LocationType } from '@prisma/client';
import { PostgresDBService, TPagination } from './common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';

export type TLocationWithIncludes = Location & {
  locationTypeData?: LocationType;
};

export type TLocationFilters = {
  filters?: Prisma.LocationWhereInput;
  orderBy?: Prisma.LocationOrderByWithRelationInput | Prisma.LocationOrderByWithRelationInput[];
  include?: Prisma.LocationInclude;
  exclude?: Array<keyof Location>;
};

export class LocationPostgresService extends PostgresDBService<'location' | 'locations', Location> {
  location: Location | null;
  fields = [
    'id',
    'name',
    'address',
    'longitude',
    'latitude',
    'description',
    'locationType',
    'city',
    'deviceData',
    'addedBy',
    'created',
    'updated',
  ];

  constructor({ softDelete = false, location = undefined }: { softDelete?: boolean; location?: Location }) {
    super({ softDelete });
    this.location = location ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TLocationFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include: this.getIncludes(include),
      };
      const [locations, total] = await this.prisma.$transaction([
        this.prisma.location.findMany({ ...q }),
        this.prisma.location.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'locations', Location>({
        data: { locations, meta: { filters, orderBy, page, limit, total, pages, prev, next, include } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TLocationFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include: this.getIncludes(include) };
      const [locations, total] = await this.prisma.$transaction([
        this.prisma.location.findMany({ ...q }),
        this.prisma.location.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'locations', Location>({
        data: { locations, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.LocationInclude }): Promise<this> {
    try {
      const q = { where: { id }, include: this.getIncludes(include) };
      this.location = await this.prisma.location.findUnique({ ...q });
      this.result = this.location
        ? statusTMap.get('OK')!<'location', Location>({
            data: { location: this.location, meta: { filters: q.where, include } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TLocationFilters) {
    try {
      const location = await this.prisma.location.findFirst({ where: { ...filters }, include, orderBy });
      this.result = location
        ? statusTMap.get('OK')!<'location', Location>({ data: { location, meta: { filters, include, orderBy } } })
        : statusTMap.get('NotFound')!({ data: { meta: filters, include, orderBy } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async search(): Promise<this> {
    return this;
  }

  async create(createData: Partial<Location>, include?: Prisma.LocationInclude): Promise<this> {
    const data = this.sanitize<Location>(this.fields, createData);
    try {
      this.location = await this.prisma.location.create({
        data: { ...(data as Prisma.LocationCreateInput) },
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('Created')!({ data: { location: this.location } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<Location>, include?: Prisma.LocationInclude): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertLocationExists();
      const id = this.location.id;
      this.location = await this.prisma.location.update({ where: { id }, data, include: this.getIncludes(include) });
      this.result = statusTMap.get('OK')!<'location', Location>({
        message: 'App setting updated',
        data: { location: this.location },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertLocationExists();
      const id = this.location.id;
      const deletedLocation = await this.prisma.location.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedLocation, recoverable: this.softDelete } },
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

  private assertLocationExists(): asserts this is this & { location: Location } {
    if (!this.location || !this.location.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  private unset() {
    this.location = null;
  }

  private getIncludes(include?: Prisma.LocationInclude) {
    const countInclude: Prisma.LocationInclude = {
      locationTypeData: true,
    };
    return { ...include, ...countInclude };
  }
}
