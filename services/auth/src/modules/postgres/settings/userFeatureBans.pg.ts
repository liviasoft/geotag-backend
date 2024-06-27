import { Feature, Prisma, User, UserFeatureBan } from '@prisma/client';
import { PostgresDBService, TPagination } from '../common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { TUserWithIncludes } from '../user.pg';
import { TFeatureWithIncludes } from './features.pg';

export type TUserFeatureBanWithIncludes = UserFeatureBan & {
  userData?: User | TUserWithIncludes;
  featureData?: Feature | TFeatureWithIncludes;
};

export type TUserFeatureBanFilters = {
  filters?: Prisma.UserFeatureBanWhereInput;
  orderBy?: Prisma.UserFeatureBanOrderByWithRelationInput | Prisma.UserFeatureBanOrderByWithRelationInput[];
  include?: Prisma.UserFeatureBanInclude;
  exclude?: Array<keyof UserFeatureBan>;
};

export class UserFeatureBanPostgresService extends PostgresDBService<
  'userFeatureBan' | 'userFeatureBans',
  UserFeatureBan
> {
  userFeatureBan: UserFeatureBan | null;
  fields = ['id', 'user', 'feature', 'expiresAt', 'created', 'updated'];

  constructor({
    softDelete = false,
    userFeatureBan = undefined,
  }: {
    softDelete?: boolean;
    userFeatureBan?: UserFeatureBan;
  }) {
    super({ softDelete });
    this.userFeatureBan = userFeatureBan ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TUserFeatureBanFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include,
      };
      const [userFeatureBans, total] = await this.prisma.$transaction([
        this.prisma.userFeatureBan.findMany({ ...q }),
        this.prisma.userFeatureBan.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'userFeatureBans', UserFeatureBan>({
        data: { userFeatureBans, meta: { filters, orderBy, page, limit, total, pages, prev, next } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TUserFeatureBanFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include };
      const [userFeatureBans, total] = await this.prisma.$transaction([
        this.prisma.userFeatureBan.findMany({ ...q }),
        this.prisma.userFeatureBan.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'userFeatureBans', UserFeatureBan>({
        data: { userFeatureBans, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.UserFeatureBanInclude }): Promise<this> {
    try {
      const q = { where: { id }, include };
      this.userFeatureBan = await this.prisma.userFeatureBan.findUnique({ ...q });
      this.result = this.userFeatureBan
        ? statusTMap.get('OK')!<'userFeatureBan', UserFeatureBan>({
            data: { userFeatureBan: this.userFeatureBan, meta: { filters: q } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TUserFeatureBanFilters) {
    try {
      const userFeatureBan = await this.prisma.userFeatureBan.findFirst({ where: { ...filters }, include, orderBy });
      this.result = userFeatureBan
        ? statusTMap.get('OK')!<'userFeatureBan', UserFeatureBan>({
            data: { userFeatureBan, meta: { filters, include, orderBy } },
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

  async create(createData: Partial<UserFeatureBan>, include?: Prisma.UserFeatureBanInclude): Promise<this> {
    const data = this.sanitize<UserFeatureBan>(this.fields, createData);
    try {
      this.userFeatureBan = await this.prisma.userFeatureBan.create({
        data: { ...(data as Prisma.UserFeatureBanCreateInput) },
        include,
      });
      this.result = statusTMap.get('Created')!({ data: { userFeatureBan: this.userFeatureBan } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<UserFeatureBan>, include?: Prisma.UserFeatureBanInclude): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertUserFeatureBanExists();
      const id = this.userFeatureBan.id;
      this.userFeatureBan = await this.prisma.userFeatureBan.update({ where: { id }, data, include });
      this.result = statusTMap.get('OK')!<'userFeatureBan', UserFeatureBan>({
        message: 'App setting updated',
        data: { userFeatureBan: this.userFeatureBan },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertUserFeatureBanExists();
      const id = this.userFeatureBan.id;
      const deletedUserFeatureBan = await this.prisma.userFeatureBan.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedUserFeatureBan, recoverable: this.softDelete } },
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

  private assertUserFeatureBanExists(): asserts this is this & { userFeatureBan: UserFeatureBan } {
    if (!this.userFeatureBan || !this.userFeatureBan.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  private unset() {
    this.userFeatureBan = null;
  }
}
