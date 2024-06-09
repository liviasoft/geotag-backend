import { Prisma, Resource, User, UserResourcePermission } from '@prisma/client';
import { PostgresDBService, TPagination } from '../common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { TUserWithIncludes } from '../user.pg';
import { TResourceWithIncludes } from './resources.pg';

export type TUserResourcePermissionWithInclude = UserResourcePermission & {
  userData?: User | TUserWithIncludes;
  resourceData?: Resource | TResourceWithIncludes;
};

export type TUserResourcePermissionFilters = {
  filters?: Prisma.UserResourcePermissionWhereInput;
  orderBy?:
    | Prisma.UserResourcePermissionOrderByWithRelationInput
    | Prisma.UserResourcePermissionOrderByWithRelationInput[];
  include?: Prisma.UserResourcePermissionInclude;
  exclude?: Array<keyof UserResourcePermission>;
};

export class UserResourcePermissionPostgresService extends PostgresDBService<
  'userResourcePermission' | 'userResourcePermissions',
  UserResourcePermission
> {
  userResourcePermission: UserResourcePermission | null;
  fields = [
    'id',
    'user',
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
    userResourcePermission = undefined,
  }: {
    softDelete?: boolean;
    userResourcePermission?: UserResourcePermission;
  }) {
    super({ softDelete });
    this.userResourcePermission = userResourcePermission ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TUserResourcePermissionFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include,
      };
      const [userResourcePermissions, total] = await this.prisma.$transaction([
        this.prisma.userResourcePermission.findMany({ ...q }),
        this.prisma.userResourcePermission.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'userResourcePermissions', UserResourcePermission>({
        data: { userResourcePermissions, meta: { filters, orderBy, page, limit, total, pages, prev, next } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TUserResourcePermissionFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include };
      const [userResourcePermissions, total] = await this.prisma.$transaction([
        this.prisma.userResourcePermission.findMany({ ...q }),
        this.prisma.userResourcePermission.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'userResourcePermissions', UserResourcePermission>({
        data: { userResourcePermissions, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.UserResourcePermissionInclude }): Promise<this> {
    try {
      const q = { where: { id }, include };
      this.userResourcePermission = await this.prisma.userResourcePermission.findUnique({ ...q });
      this.result = this.userResourcePermission
        ? statusTMap.get('OK')!<'userResourcePermission', UserResourcePermission>({
            data: { userResourcePermission: this.userResourcePermission, meta: { filters: q } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TUserResourcePermissionFilters) {
    try {
      const userResourcePermission = await this.prisma.userResourcePermission.findFirst({
        where: { ...filters },
        include,
        orderBy,
      });
      this.result = userResourcePermission
        ? statusTMap.get('OK')!<'userResourcePermission', UserResourcePermission>({
            data: { userResourcePermission, meta: { filters, include, orderBy } },
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
    createData: Partial<UserResourcePermission>,
    include?: Prisma.UserResourcePermissionInclude,
  ): Promise<this> {
    const data = this.sanitize<UserResourcePermission>(this.fields, createData);
    try {
      this.userResourcePermission = await this.prisma.userResourcePermission.create({
        data: { ...(data as Prisma.UserResourcePermissionCreateInput) },
        include,
      });
      this.result = statusTMap.get('Created')!({ data: { userResourcePermission: this.userResourcePermission } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(
    updateData: Partial<UserResourcePermission>,
    include?: Prisma.UserResourcePermissionInclude,
  ): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertUserResourcePermissionExists();
      const id = this.userResourcePermission.id;
      this.userResourcePermission = await this.prisma.userResourcePermission.update({ where: { id }, data, include });
      this.result = statusTMap.get('OK')!<'userResourcePermission', UserResourcePermission>({
        message: 'App setting updated',
        data: { userResourcePermission: this.userResourcePermission },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertUserResourcePermissionExists();
      const id = this.userResourcePermission.id;
      const deletedUserResourcePermission = await this.prisma.userResourcePermission.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedUserResourcePermission, recoverable: this.softDelete } },
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

  private assertUserResourcePermissionExists(): asserts this is this & {
    userResourcePermission: UserResourcePermission;
  } {
    if (!this.userResourcePermission || !this.userResourcePermission.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  private unset() {
    this.userResourcePermission = null;
  }
}
