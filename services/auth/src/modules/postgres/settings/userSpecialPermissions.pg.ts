import { Prisma, SpecialPermission, User, UserSpecialPermission } from '@prisma/client';
import { PostgresDBService, TPagination } from '../common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { TUserWithIncludes } from '../user.pg';
import { TSpecialPermissionWithIncludes } from './specialPermissions.pg';

export type TUserSpecialPermissionWithInclude = UserSpecialPermission & {
  userData?: User | TUserWithIncludes;
  specialPermissionData?: SpecialPermission | TSpecialPermissionWithIncludes;
};

export type TUserSpecialPermissionFilters = {
  filters?: Prisma.UserSpecialPermissionWhereInput;
  orderBy?:
    | Prisma.UserSpecialPermissionOrderByWithRelationInput
    | Prisma.UserSpecialPermissionOrderByWithRelationInput[];
  include?: Prisma.UserSpecialPermissionInclude;
  exclude?: Array<keyof UserSpecialPermission>;
};

export class UserSpecialPermissionPostgresService extends PostgresDBService<
  'userSpecialPermission' | 'userSpecialPermissions',
  UserSpecialPermission
> {
  userSpecialPermission: UserSpecialPermission | null;
  fields = ['id', 'user', 'specialPermission', 'description', 'active', 'created', 'updated'];

  constructor({
    softDelete = false,
    userSpecialPermission = undefined,
  }: {
    softDelete?: boolean;
    userSpecialPermission?: UserSpecialPermission;
  }) {
    super({ softDelete });
    this.userSpecialPermission = userSpecialPermission ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TUserSpecialPermissionFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include,
      };
      const [userSpecialPermissions, total] = await this.prisma.$transaction([
        this.prisma.userSpecialPermission.findMany({ ...q }),
        this.prisma.userSpecialPermission.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'userSpecialPermissions', UserSpecialPermission>({
        data: { userSpecialPermissions, meta: { filters, orderBy, page, limit, total, pages, prev, next } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TUserSpecialPermissionFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include };
      const [userSpecialPermissions, total] = await this.prisma.$transaction([
        this.prisma.userSpecialPermission.findMany({ ...q }),
        this.prisma.userSpecialPermission.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'userSpecialPermissions', UserSpecialPermission>({
        data: { userSpecialPermissions, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.UserSpecialPermissionInclude }): Promise<this> {
    try {
      const q = { where: { id }, include };
      this.userSpecialPermission = await this.prisma.userSpecialPermission.findUnique({ ...q });
      this.result = this.userSpecialPermission
        ? statusTMap.get('OK')!<'userSpecialPermission', UserSpecialPermission>({
            data: { userSpecialPermission: this.userSpecialPermission, meta: { filters: q } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TUserSpecialPermissionFilters) {
    try {
      const userSpecialPermission = await this.prisma.userSpecialPermission.findFirst({
        where: { ...filters },
        include,
        orderBy,
      });
      this.result = userSpecialPermission
        ? statusTMap.get('OK')!<'userSpecialPermission', UserSpecialPermission>({
            data: { userSpecialPermission, meta: { filters, include, orderBy } },
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
    createData: Partial<UserSpecialPermission>,
    include?: Prisma.UserSpecialPermissionInclude,
  ): Promise<this> {
    const data = this.sanitize<UserSpecialPermission>(this.fields, createData);
    try {
      this.userSpecialPermission = await this.prisma.userSpecialPermission.create({
        data: { ...(data as Prisma.UserSpecialPermissionCreateInput) },
        include,
      });
      this.result = statusTMap.get('Created')!({ data: { userSpecialPermission: this.userSpecialPermission } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(
    updateData: Partial<UserSpecialPermission>,
    include?: Prisma.UserSpecialPermissionInclude,
  ): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertUserSpecialPermissionExists();
      const id = this.userSpecialPermission.id;
      this.userSpecialPermission = await this.prisma.userSpecialPermission.update({ where: { id }, data, include });
      this.result = statusTMap.get('OK')!<'userSpecialPermission', UserSpecialPermission>({
        message: 'App setting updated',
        data: { userSpecialPermission: this.userSpecialPermission },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertUserSpecialPermissionExists();
      const id = this.userSpecialPermission.id;
      const deletedUserSpecialPermission = await this.prisma.userSpecialPermission.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedUserSpecialPermission, recoverable: this.softDelete } },
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

  private assertUserSpecialPermissionExists(): asserts this is this & { userSpecialPermission: UserSpecialPermission } {
    if (!this.userSpecialPermission || !this.userSpecialPermission.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  private unset() {
    this.userSpecialPermission = null;
  }
}
