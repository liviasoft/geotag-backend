import { Prisma, Role, RolePermission, RoleSpecialPermission, User } from '@prisma/client';
import { PostgresDBService, TPagination } from '../common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { TUserWithIncludes } from '../user.pg';
import { TRolePermissionWithInclude } from './rolePermissions.pg';
import { TRoleSpecialPermissionWithInclude } from './roleSpecialPermissions.pg';

export type TRoleWithIncludes = Role & {
  users?: User[] | TUserWithIncludes[];
  permissions?: RolePermission[] | TRolePermissionWithInclude[];
  specialPermissions?: RoleSpecialPermission[] | TRoleSpecialPermissionWithInclude[];
};

export type TRoleFilters = {
  filters?: Prisma.RoleWhereInput;
  orderBy?: Prisma.RoleOrderByWithRelationInput | Prisma.RoleOrderByWithRelationInput[];
  include?: Prisma.RoleInclude;
};

export class RolePostgresService extends PostgresDBService<'roles' | 'role', Role> {
  role: Role | null;
  fields = ['id', 'name', 'description', 'isDefault', 'requiresAuth', 'active', 'created', 'updated'];

  constructor({ softDelete = false, role = undefined }: { softDelete?: boolean; role?: Role }) {
    super({ softDelete });
    this.role = role ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TRoleFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include: this.getIncludes(include),
      };
      const [roles, total] = await this.prisma.$transaction([
        this.prisma.role.findMany({ ...q }),
        this.prisma.role.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'roles', Role>({
        data: { roles, meta: { filters, orderBy, page, limit, total, pages, prev, next } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TRoleFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include: this.getIncludes(include) };
      const [roles, total] = await this.prisma.$transaction([
        this.prisma.role.findMany({ ...q }),
        this.prisma.role.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'roles', Role>({
        data: { roles, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.RoleInclude }): Promise<this> {
    try {
      const q = { where: { id }, include: this.getIncludes(include) };
      this.role = await this.prisma.role.findUnique({ ...q });
      this.result = this.role
        ? statusTMap.get('OK')!<'role', Role>({
            data: { role: this.role, meta: { filters: q } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TRoleFilters) {
    try {
      const role = await this.prisma.role.findFirst({ where: { ...filters }, include, orderBy });
      this.result = role
        ? statusTMap.get('OK')!<'role', Role>({ data: { role, meta: { filters, include, orderBy } } })
        : statusTMap.get('NotFound')!({ data: { meta: filters, include, orderBy } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async search(): Promise<this> {
    return this;
  }

  async create(createData: Partial<Role>, include?: Prisma.RoleInclude): Promise<this> {
    const data = this.sanitize<Role>(this.fields, createData);
    console.log({ createData, sanitizedData: data });
    try {
      this.role = await this.prisma.role.create({
        data: { ...(data as Prisma.RoleCreateInput) },
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('Created')!({ data: { role: this.role } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<Role>, include?: Prisma.RoleInclude): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertRoleExists();
      const id = this.role.id;
      this.role = await this.prisma.role.update({ where: { id }, data, include: this.getIncludes(include) });
      this.result = statusTMap.get('OK')!<'role', Role>({
        message: 'App setting updated',
        data: { role: this.role },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertRoleExists();
      const id = this.role.id;
      const deletedRole = await this.prisma.role.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedRole, recoverable: this.softDelete } },
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

  assertRoleExists(): asserts this is this & { role: Role } {
    if (!this.role || !this.role.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  unset() {
    this.role = null;
  }

  getIncludes(include?: Prisma.RoleInclude) {
    const countInclude: Prisma.RoleInclude = {
      _count: { select: { users: true, permissions: true, specialPermissions: true } },
    };
    return { ...include, ...countInclude };
  }
}
