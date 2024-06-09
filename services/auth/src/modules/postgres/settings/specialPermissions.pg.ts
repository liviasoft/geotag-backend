import { Prisma, RoleSpecialPermission, SpecialPermission, User } from '@prisma/client';
import { PostgresDBService, TPagination } from '../common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { TRoleSpecialPermissionWithInclude } from './roleSpecialPermissions.pg';
import { TUserWithIncludes } from '../user.pg';

export type TSpecialPermissionWithIncludes = SpecialPermission & {
  roles?: RoleSpecialPermission[] | TRoleSpecialPermissionWithInclude[];
  users?: User | TUserWithIncludes;
};

export type TSpecialPermissionFilters = {
  filters?: Prisma.SpecialPermissionWhereInput;
  orderBy?: Prisma.SpecialPermissionOrderByWithRelationInput | Prisma.SpecialPermissionOrderByWithRelationInput[];
  include?: Prisma.SpecialPermissionInclude;
  exclude?: Array<keyof SpecialPermission>;
};

export class SpecialPermissionPostgresService extends PostgresDBService<
  'specialPermission' | 'specialPermissions',
  SpecialPermission
> {
  specialPermission: SpecialPermission | null;
  fields = ['id', 'name', 'description', 'active', 'created', 'updated'];

  constructor({
    softDelete = false,
    specialPermission = undefined,
  }: {
    softDelete?: boolean;
    specialPermission?: SpecialPermission;
  }) {
    super({ softDelete });
    this.specialPermission = specialPermission ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TSpecialPermissionFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include: this.getIncludes(include),
      };
      const [specialPermissions, total] = await this.prisma.$transaction([
        this.prisma.specialPermission.findMany({ ...q }),
        this.prisma.specialPermission.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'specialPermissions', SpecialPermission>({
        data: { specialPermissions, meta: { filters, orderBy, page, limit, total, pages, prev, next } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TSpecialPermissionFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include: this.getIncludes(include) };
      const [specialPermissions, total] = await this.prisma.$transaction([
        this.prisma.specialPermission.findMany({ ...q }),
        this.prisma.specialPermission.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'specialPermissions', SpecialPermission>({
        data: { specialPermissions, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.SpecialPermissionInclude }): Promise<this> {
    try {
      const q = { where: { id }, include: this.getIncludes(include) };
      this.specialPermission = await this.prisma.specialPermission.findUnique({ ...q });
      this.result = this.specialPermission
        ? statusTMap.get('OK')!<'specialPermission', SpecialPermission>({
            data: { specialPermission: this.specialPermission, meta: { filters: q } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TSpecialPermissionFilters) {
    try {
      const specialPermission = await this.prisma.specialPermission.findFirst({
        where: { ...filters },
        include,
        orderBy,
      });
      this.result = specialPermission
        ? statusTMap.get('OK')!<'specialPermission', SpecialPermission>({
            data: { specialPermission, meta: { filters, include, orderBy } },
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

  async create(createData: Partial<SpecialPermission>, include?: Prisma.SpecialPermissionInclude): Promise<this> {
    const data = this.sanitize<SpecialPermission>(this.fields, createData);
    try {
      this.specialPermission = await this.prisma.specialPermission.create({
        data: { ...(data as Prisma.SpecialPermissionCreateInput) },
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('Created')!({ data: { specialPermission: this.specialPermission } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<SpecialPermission>, include?: Prisma.SpecialPermissionInclude): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertSpecialPermissionExists();
      const id = this.specialPermission.id;
      this.specialPermission = await this.prisma.specialPermission.update({
        where: { id },
        data,
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('OK')!<'specialPermission', SpecialPermission>({
        message: 'App setting updated',
        data: { specialPermission: this.specialPermission },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertSpecialPermissionExists();
      const id = this.specialPermission.id;
      const deletedSpecialPermission = await this.prisma.specialPermission.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedSpecialPermission, recoverable: this.softDelete } },
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

  private assertSpecialPermissionExists(): asserts this is this & { specialPermission: SpecialPermission } {
    if (!this.specialPermission || !this.specialPermission.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  private unset() {
    this.specialPermission = null;
  }

  private getIncludes(include?: Prisma.SpecialPermissionInclude) {
    const countInclude: Prisma.SpecialPermissionInclude = {
      _count: { select: { roles: true, users: true } },
    };
    return { ...include, ...countInclude };
  }
}
