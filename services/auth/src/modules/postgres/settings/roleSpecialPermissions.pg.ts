import { Prisma, Role, RoleSpecialPermission, SpecialPermission } from '@prisma/client';
import { PostgresDBService, TPagination } from '../common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { TRoleWithIncludes } from './roles.pg';
import { TSpecialPermissionWithIncludes } from './specialPermissions.pg';

export type TRoleSpecialPermissionWithInclude = RoleSpecialPermission & {
  roleData?: Role | TRoleWithIncludes;
  specialPermissionData?: SpecialPermission | TSpecialPermissionWithIncludes;
};

export type TRoleSpecialPermissionFilters = {
  filters?: Prisma.RoleSpecialPermissionWhereInput;
  orderBy?:
    | Prisma.RoleSpecialPermissionOrderByWithRelationInput
    | Prisma.RoleSpecialPermissionOrderByWithRelationInput[];
  include?: Prisma.RoleSpecialPermissionInclude;
  exclude?: Array<keyof RoleSpecialPermission>;
};

export class RoleSpecialPermissionPostgresService extends PostgresDBService<
  'roleSpecialPermission' | 'roleSpecialPermissions',
  RoleSpecialPermission
> {
  roleSpecialPermission: RoleSpecialPermission | null;
  fields = ['id', 'role', 'specialPermission', 'active', 'description', 'created', 'updated'];

  constructor({
    softDelete = false,
    roleSpecialPermission = undefined,
  }: {
    softDelete?: boolean;
    roleSpecialPermission?: RoleSpecialPermission;
  }) {
    super({ softDelete });
    this.roleSpecialPermission = roleSpecialPermission ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TRoleSpecialPermissionFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include,
      };
      const [roleSpecialPermissions, total] = await this.prisma.$transaction([
        this.prisma.roleSpecialPermission.findMany({ ...q }),
        this.prisma.roleSpecialPermission.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'roleSpecialPermissions', RoleSpecialPermission>({
        data: { roleSpecialPermissions, meta: { filters, orderBy, page, limit, total, pages, prev, next } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TRoleSpecialPermissionFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include };
      const [roleSpecialPermissions, total] = await this.prisma.$transaction([
        this.prisma.roleSpecialPermission.findMany({ ...q }),
        this.prisma.roleSpecialPermission.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'roleSpecialPermissions', RoleSpecialPermission>({
        data: { roleSpecialPermissions, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.RoleSpecialPermissionInclude }): Promise<this> {
    try {
      const q = { where: { id }, include };
      this.roleSpecialPermission = await this.prisma.roleSpecialPermission.findUnique({ ...q });
      this.result = this.roleSpecialPermission
        ? statusTMap.get('OK')!<'roleSpecialPermission', RoleSpecialPermission>({
            data: { roleSpecialPermission: this.roleSpecialPermission, meta: { filters: q } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TRoleSpecialPermissionFilters) {
    try {
      const roleSpecialPermission = await this.prisma.roleSpecialPermission.findFirst({
        where: { ...filters },
        include,
        orderBy,
      });
      this.result = roleSpecialPermission
        ? statusTMap.get('OK')!<'roleSpecialPermission', RoleSpecialPermission>({
            data: { roleSpecialPermission, meta: { filters, include, orderBy } },
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

  async create(
    createData: Partial<RoleSpecialPermission>,
    include?: Prisma.RoleSpecialPermissionInclude,
  ): Promise<this> {
    const data = this.sanitize<RoleSpecialPermission>(this.fields, createData);
    try {
      this.roleSpecialPermission = await this.prisma.roleSpecialPermission.create({
        data: { ...(data as Prisma.RoleSpecialPermissionCreateInput) },
        include,
      });
      this.result = statusTMap.get('Created')!({ data: { roleSpecialPermission: this.roleSpecialPermission } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(
    updateData: Partial<RoleSpecialPermission>,
    include?: Prisma.RoleSpecialPermissionInclude,
  ): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertRoleSpecialPermissionExists();
      const id = this.roleSpecialPermission.id;
      this.roleSpecialPermission = await this.prisma.roleSpecialPermission.update({ where: { id }, data, include });
      this.result = statusTMap.get('OK')!<'roleSpecialPermission', RoleSpecialPermission>({
        message: 'App setting updated',
        data: { roleSpecialPermission: this.roleSpecialPermission },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertRoleSpecialPermissionExists();
      const id = this.roleSpecialPermission.id;
      const deletedRoleSpecialPermission = await this.prisma.roleSpecialPermission.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedRoleSpecialPermission, recoverable: this.softDelete } },
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

  private assertRoleSpecialPermissionExists(): asserts this is this & { roleSpecialPermission: RoleSpecialPermission } {
    if (!this.roleSpecialPermission || !this.roleSpecialPermission.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  private unset() {
    this.roleSpecialPermission = null;
  }
}
