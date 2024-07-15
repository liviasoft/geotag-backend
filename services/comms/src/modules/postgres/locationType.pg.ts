import { Prisma, LocationType, Location } from '@prisma/client';
import { PostgresDBService, TPagination } from './common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';

export type TLocationTypeWithIncludes = LocationType & {
  locations?: Location[];
};

export type TLocationTypeFilters = {
  filters?: Prisma.LocationTypeWhereInput;
  orderBy?: Prisma.LocationTypeOrderByWithRelationInput | Prisma.LocationTypeOrderByWithRelationInput[];
  include?: Prisma.LocationTypeInclude;
  exclude?: Array<keyof LocationType>;
};

export class LocationTypePostgresService extends PostgresDBService<'locationType' | 'locationTypes', LocationType> {
  locationType: LocationType | null;
  fields = ['id', 'name', 'description', 'icon', 'iconUrl', 'created', 'updated'];

  constructor({ softDelete = false, locationType = undefined }: { softDelete?: boolean; locationType?: LocationType }) {
    super({ softDelete });
    this.locationType = locationType ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TLocationTypeFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include: this.getIncludes(include),
      };
      const [locationTypes, total] = await this.prisma.$transaction([
        this.prisma.locationType.findMany({ ...q }),
        this.prisma.locationType.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'locationTypes', LocationType>({
        data: { locationTypes, meta: { filters, orderBy, page, limit, total, pages, prev, next, include } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TLocationTypeFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include: this.getIncludes(include) };
      const [locationTypes, total] = await this.prisma.$transaction([
        this.prisma.locationType.findMany({ ...q }),
        this.prisma.locationType.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'locationTypes', LocationType>({
        data: { locationTypes, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.LocationTypeInclude }): Promise<this> {
    try {
      const q = { where: { id }, include: this.getIncludes(include) };
      this.locationType = await this.prisma.locationType.findUnique({ ...q });
      this.result = this.locationType
        ? statusTMap.get('OK')!<'locationType', LocationType>({
            data: { locationType: this.locationType, meta: { filters: q.where, include } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TLocationTypeFilters) {
    try {
      const locationType = await this.prisma.locationType.findFirst({ where: { ...filters }, include, orderBy });
      this.result = locationType
        ? statusTMap.get('OK')!<'locationType', LocationType>({
            data: { locationType, meta: { filters, include, orderBy } },
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

  async create(createData: Partial<LocationType>, include?: Prisma.LocationTypeInclude): Promise<this> {
    const data = this.sanitize<LocationType>(this.fields, createData);
    try {
      this.locationType = await this.prisma.locationType.create({
        data: { ...(data as Prisma.LocationTypeCreateInput) },
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('Created')!({ data: { locationType: this.locationType } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<LocationType>, include?: Prisma.LocationTypeInclude): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertLocationTypeExists();
      const id = this.locationType.id;
      this.locationType = await this.prisma.locationType.update({
        where: { id },
        data,
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('OK')!<'locationType', LocationType>({
        message: 'App setting updated',
        data: { locationType: this.locationType },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertLocationTypeExists();
      const id = this.locationType.id;
      const deletedLocationType = await this.prisma.locationType.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedLocationType, recoverable: this.softDelete } },
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

  private assertLocationTypeExists(): asserts this is this & { locationType: LocationType } {
    if (!this.locationType || !this.locationType.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  private unset() {
    this.locationType = null;
  }

  private getIncludes(include?: Prisma.LocationTypeInclude) {
    const countInclude: Prisma.LocationTypeInclude = {
      _count: { select: { locations: true } },
    };
    return { ...include, ...countInclude };
  }
}
