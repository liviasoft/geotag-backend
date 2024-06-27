import { Prisma, Resource, RolePermission, UserResourcePermission } from '@prisma/client';
import { PostgresDBService, TPagination } from '../common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';

export type TResourceWithIncludes = Resource & {
  rolePermissions?: RolePermission[];
  userPermissions?: UserResourcePermission[];
};

export type TResourceFilters = {
  filters?: Prisma.ResourceWhereInput;
  orderBy?: Prisma.ResourceOrderByWithRelationInput | Prisma.ResourceOrderByWithRelationInput[];
  include?: Prisma.ResourceInclude;
};

export class ResourcePostgresService extends PostgresDBService<'resources' | 'resource', Resource> {
  resource: Resource | null;
  fields = ['id', 'name', 'description', 'created', 'updated'];

  constructor({ softDelete = false, resource = undefined }: { softDelete?: boolean; resource?: Resource }) {
    super({ softDelete });
    this.resource = resource ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TResourceFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include: this.getIncludes(include),
      };
      const [resources, total] = await this.prisma.$transaction([
        this.prisma.resource.findMany({ ...q }),
        this.prisma.resource.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'resources', Resource>({
        data: { resources, meta: { filters, orderBy, page, limit, total, pages, prev, next } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TResourceFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include: this.getIncludes(include) };
      const [resources, total] = await this.prisma.$transaction([
        this.prisma.resource.findMany({ ...q }),
        this.prisma.resource.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'resources', Resource>({
        data: { resources, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.ResourceInclude }): Promise<this> {
    try {
      const q = { where: { id }, include: this.getIncludes(include) };
      this.resource = await this.prisma.resource.findUnique({ ...q });
      this.result = this.resource
        ? statusTMap.get('OK')!<'resource', Resource>({
            data: { resource: this.resource, meta: { filters: q } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TResourceFilters) {
    try {
      const resource = await this.prisma.resource.findFirst({ where: { ...filters }, include, orderBy });
      this.result = resource
        ? statusTMap.get('OK')!<'resource', Resource>({ data: { resource, meta: { filters, include, orderBy } } })
        : statusTMap.get('NotFound')!({ data: { meta: filters, include, orderBy } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async search(): Promise<this> {
    return this;
  }

  async create(createData: Partial<Resource>, include?: Prisma.ResourceInclude): Promise<this> {
    const data = this.sanitize<Resource>(this.fields, createData);
    try {
      this.resource = await this.prisma.resource.create({
        data: { ...(data as Prisma.ResourceCreateInput) },
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('Created')!({ data: { resource: this.resource } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<Resource>, include?: Prisma.ResourceInclude): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertResourceExists();
      const id = this.resource.id;
      this.resource = await this.prisma.resource.update({ where: { id }, data, include: this.getIncludes(include) });
      this.result = statusTMap.get('OK')!<'resource', Resource>({
        message: 'App setting updated',
        data: { resource: this.resource },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertResourceExists();
      const id = this.resource.id;
      const deletedResource = await this.prisma.resource.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedResource, recoverable: this.softDelete } },
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

  assertResourceExists(): asserts this is this & { resource: Resource } {
    if (!this.resource || !this.resource.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  unset() {
    this.resource = null;
  }

  getIncludes(include?: Prisma.ResourceInclude) {
    const countInclude: Prisma.ResourceInclude = {
      _count: { select: { rolePermissions: true, userPermissions: true } },
    };
    return { ...include, ...countInclude };
  }
}
