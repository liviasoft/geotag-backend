import { Prisma, Role, User, UserFeatureBan, UserResourcePermission, UserSpecialPermission } from '@prisma/client';
import { PostgresDBService, TPagination } from './common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { TRoleWithIncludes } from './settings/roles.pg';

export type TUserWithIncludes = User & {
  roles?: Role[] | TRoleWithIncludes[];
  featureBans?: UserFeatureBan[];
  resourcePermissions?: UserResourcePermission[];
  specialPermissions?: UserSpecialPermission[];
};

export type TUserFilters = {
  filters?: Prisma.UserWhereInput;
  orderBy?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
  include?: Prisma.UserInclude;
  exclude?: Array<keyof User>;
};

export class UserPostgresService extends PostgresDBService<'user' | 'users', User> {
  user: User | null;
  fields = [
    'id',
    'username',
    'email',
    'phone',
    'phoneData',
    'avatar',
    'avatarUrl',
    'roles',
    'emailVisibility',
    'verified',
    'created',
    'updated',
  ];

  constructor({ softDelete = false, user = undefined }: { softDelete?: boolean; user?: User }) {
    super({ softDelete });
    this.user = user ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TUserFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include: this.getIncludes(include),
      };
      const [users, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({ ...q }),
        this.prisma.user.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'users', User>({
        data: { users, meta: { filters, orderBy, page, limit, total, pages, prev, next, include } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TUserFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include: this.getIncludes(include) };
      const [users, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({ ...q }),
        this.prisma.user.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'users', User>({
        data: { users, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.UserInclude }): Promise<this> {
    try {
      const q = { where: { id }, include: this.getIncludes(include) };
      this.user = await this.prisma.user.findUnique({ ...q });
      this.result = this.user
        ? statusTMap.get('OK')!<'user', User>({
            data: { user: this.user, meta: { filters: q.where, include } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TUserFilters) {
    try {
      const user = await this.prisma.user.findFirst({ where: { ...filters }, include, orderBy });
      this.result = user
        ? statusTMap.get('OK')!<'user', User>({ data: { user, meta: { filters, include, orderBy } } })
        : statusTMap.get('NotFound')!({ data: { meta: filters, include, orderBy } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async search(): Promise<this> {
    return this;
  }

  async create(createData: Partial<User>, include?: Prisma.UserInclude): Promise<this> {
    const data = this.sanitize<User>(this.fields, createData);
    try {
      this.user = await this.prisma.user.create({
        data: { ...(data as Prisma.UserCreateInput) },
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('Created')!({ data: { user: this.user } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<User>, include?: Prisma.UserInclude): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertUserExists();
      const id = this.user.id;
      this.user = await this.prisma.user.update({ where: { id }, data, include: this.getIncludes(include) });
      this.result = statusTMap.get('OK')!<'user', User>({
        message: 'App setting updated',
        data: { user: this.user },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertUserExists();
      const id = this.user.id;
      const deletedUser = await this.prisma.user.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedUser, recoverable: this.softDelete } },
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

  private assertUserExists(): asserts this is this & { user: User } {
    if (!this.user || !this.user.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  private unset() {
    this.user = null;
  }

  private getIncludes(include?: Prisma.UserInclude) {
    const countInclude: Prisma.UserInclude = {
      _count: { select: { featureBans: true, resourcePermissions: true, roles: true, specialPermissions: true } },
    };
    return { ...include, ...countInclude };
  }
}
