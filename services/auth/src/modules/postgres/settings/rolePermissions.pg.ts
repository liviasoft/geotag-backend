import { Prisma, Resource, Role, RolePermission } from '@prisma/client';
import { PostgresDBService, TPagination } from '../common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { TRoleWithIncludes } from './roles.pg';
import { TResourceWithIncludes } from './resources.pg';

export type TRolePermissionWithInclude = RolePermission & {
  roleData?: Role | TRoleWithIncludes;
  resourceData?: Resource | TResourceWithIncludes;
};

export type TRolePermissionFilters = {
  filters?: Prisma.RolePermissionWhereInput;
  orderBy?: Prisma.RolePermissionOrderByWithRelationInput | Prisma.RolePermissionOrderByWithRelationInput[];
  include?: Prisma.RolePermissionInclude;
  exclude?: Array<keyof RolePermission>;
};

export class RolePermissionPostgresService extends PostgresDBService<
  'rolePermission' | 'rolePermissions',
  RolePermission
> {
  rolePermission: RolePermission | null;
  fields = [
    'id',
    'role',
    'resource',
    'create',
    'readOwn',
    'readAny',
    'updateOwn',
    'updateAny',
    'deleteOwn',
    'deleteAny',
    'created',
    'updated',
  ];

  constructor({
    softDelete = false,
    rolePermission = undefined,
  }: {
    softDelete?: boolean;
    rolePermission?: RolePermission;
  }) {
    super({ softDelete });
    this.rolePermission = rolePermission ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TRolePermissionFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include,
      };
      const [rolePermissions, total] = await this.prisma.$transaction([
        this.prisma.rolePermission.findMany({ ...q }),
        this.prisma.rolePermission.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'rolePermissions', RolePermission>({
        data: { rolePermissions, meta: { filters, orderBy, page, limit, total, pages, prev, next } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TRolePermissionFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include };
      const [rolePermissions, total] = await this.prisma.$transaction([
        this.prisma.rolePermission.findMany({ ...q }),
        this.prisma.rolePermission.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'rolePermissions', RolePermission>({
        data: { rolePermissions, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.RolePermissionInclude }): Promise<this> {
    try {
      const q = { where: { id }, include };
      this.rolePermission = await this.prisma.rolePermission.findUnique({ ...q });
      this.result = this.rolePermission
        ? statusTMap.get('OK')!<'rolePermission', RolePermission>({
            data: { rolePermission: this.rolePermission, meta: { filters: q } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TRolePermissionFilters) {
    try {
      const rolePermission = await this.prisma.rolePermission.findFirst({ where: { ...filters }, include, orderBy });
      this.result = rolePermission
        ? statusTMap.get('OK')!<'rolePermission', RolePermission>({
            data: { rolePermission, meta: { filters, include, orderBy } },
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

  async create(createData: Partial<RolePermission>, include?: Prisma.RolePermissionInclude): Promise<this> {
    const data = this.sanitize<RolePermission>(this.fields, createData);
    try {
      this.rolePermission = await this.prisma.rolePermission.create({
        data: { ...(data as Prisma.RolePermissionCreateInput) },
        include,
      });
      this.result = statusTMap.get('Created')!({ data: { rolePermission: this.rolePermission } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<RolePermission>, include?: Prisma.RolePermissionInclude): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertRolePermissionExists();
      const id = this.rolePermission.id;
      this.rolePermission = await this.prisma.rolePermission.update({ where: { id }, data, include });
      this.result = statusTMap.get('OK')!<'rolePermission', RolePermission>({
        message: 'App setting updated',
        data: { rolePermission: this.rolePermission },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertRolePermissionExists();
      const id = this.rolePermission.id;
      const deletedRolePermission = await this.prisma.rolePermission.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedRolePermission, recoverable: this.softDelete } },
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

  private assertRolePermissionExists(): asserts this is this & { rolePermission: RolePermission } {
    if (!this.rolePermission || !this.rolePermission.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  private unset() {
    this.rolePermission = null;
  }
}
