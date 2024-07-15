import { Prisma, UserSetting } from '@prisma/client';
import { PostgresDBService, TPagination } from '../common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';

export type TUserSettingWithIncludes = UserSetting;

export type TUserSettingFilters = {
  filters?: Prisma.UserSettingWhereInput;
  orderBy?: Prisma.UserSettingOrderByWithRelationInput | Prisma.UserSettingOrderByWithRelationInput[];
};

export class UserSettingPostgresService extends PostgresDBService<'userSettings' | 'userSetting', UserSetting> {
  userSetting: UserSetting | null;
  fields = [
    'id',
    'name',
    'description',
    'type',
    'boolean',
    'number',
    'string',
    'list',
    'object',
    'objectList',
    'created',
    'updated',
  ];

  constructor({ softDelete = false, userSetting = undefined }: { softDelete?: boolean; userSetting?: UserSetting }) {
    super({ softDelete });
    this.userSetting = userSetting ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy }: TUserSettingFilters & TPagination) {
    try {
      const q = { take: limit, skip: (page - 1) * limit, where: { ...filters }, orderBy };
      const [userSettings, total] = await this.prisma.$transaction([
        this.prisma.userSetting.findMany({ ...q }),
        this.prisma.userSetting.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'userSettings', UserSetting>({
        data: { userSettings, meta: { filters, orderBy, page, limit, total, pages, prev, next } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy }: TUserSettingFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy };
      const [userSettings, total] = await this.prisma.$transaction([
        this.prisma.userSetting.findMany({ ...q }),
        this.prisma.userSetting.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'userSettings', UserSetting>({
        data: { userSettings, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id }: { id: string }): Promise<this> {
    try {
      const q = { where: { id } };
      this.userSetting = await this.prisma.userSetting.findUnique({ ...q });
      this.result = this.userSetting
        ? statusTMap.get('OK')!<'userSetting', UserSetting>({
            data: { userSetting: this.userSetting, meta: { filters: q } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, orderBy }: TUserSettingFilters) {
    try {
      const userSetting = await this.prisma.userSetting.findFirst({ where: { ...filters }, orderBy });
      this.result = userSetting
        ? statusTMap.get('OK')!<'userSetting', UserSetting>({ data: { userSetting, meta: { filters, orderBy } } })
        : statusTMap.get('NotFound')!({ data: { meta: filters, orderBy } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async search(): Promise<this> {
    return this;
  }

  async create(createData: Partial<UserSetting>): Promise<this> {
    const data = this.sanitize<UserSetting>(this.fields, createData);
    try {
      this.userSetting = await this.prisma.userSetting.create({ data: { ...(data as Prisma.UserSettingCreateInput) } });
      this.result = statusTMap.get('Created')!({ data: { userSetting: this.userSetting } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<UserSetting>): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertUserSettingExists();
      const id = this.userSetting.id;
      this.userSetting = await this.prisma.userSetting.update({ where: { id }, data });
      this.result = statusTMap.get('OK')!<'userSetting', UserSetting>({
        message: 'App setting updated',
        data: { userSetting: this.userSetting },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertUserSettingExists();
      const id = this.userSetting.id;
      const deletedUserSetting = await this.prisma.userSetting.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedUserSetting, recoverable: this.softDelete } },
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

  assertUserSettingExists(): asserts this is this & { userSetting: UserSetting } {
    if (!this.userSetting || !this.userSetting.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  unset() {
    this.userSetting = null;
  }
}
