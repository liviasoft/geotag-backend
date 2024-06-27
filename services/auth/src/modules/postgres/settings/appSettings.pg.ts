import { Prisma, AppSetting } from '@prisma/client';
import { PostgresDBService, TPagination } from '../common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';

export type TAppSettingFilters = {
  filters?: Prisma.AppSettingWhereInput;
  orderBy?: Prisma.AppSettingOrderByWithRelationInput | Prisma.AppSettingOrderByWithRelationInput[];
  exclude?: Array<keyof AppSetting>;
};

export class AppSettingsPostgresService extends PostgresDBService<'appSettings' | 'appSetting', AppSetting> {
  appSetting: AppSetting | null;
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

  constructor({ softDelete = false, appSetting = undefined }: { softDelete?: boolean; appSetting?: AppSetting }) {
    super({ softDelete });
    this.appSetting = appSetting ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy }: TAppSettingFilters & TPagination) {
    try {
      const q = { take: limit, skip: (page - 1) * limit, where: { ...filters }, orderBy };
      const [appSettings, total] = await this.prisma.$transaction([
        this.prisma.appSetting.findMany({ ...q }),
        this.prisma.appSetting.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'appSettings', AppSetting>({
        data: { appSettings, meta: { filters, orderBy, page, limit, total, pages, prev, next } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy }: TAppSettingFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy };
      const [appSettings, total] = await this.prisma.$transaction([
        this.prisma.appSetting.findMany({ ...q }),
        this.prisma.appSetting.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'appSettings', AppSetting>({
        data: { appSettings, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id }: { id: string }): Promise<this> {
    try {
      const q = { where: { id } };
      this.appSetting = await this.prisma.appSetting.findUnique({ ...q });
      this.result = this.appSetting
        ? statusTMap.get('OK')!<'appSetting', AppSetting>({
            data: { appSetting: this.appSetting, meta: { filters: q } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, orderBy }: TAppSettingFilters) {
    try {
      const appSetting = await this.prisma.appSetting.findFirst({ where: { ...filters }, orderBy });
      this.result = appSetting
        ? statusTMap.get('OK')!<'appSetting', AppSetting>({ data: { appSetting, meta: { filters, orderBy } } })
        : statusTMap.get('NotFound')!({ data: { meta: filters, orderBy } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async search(): Promise<this> {
    return this;
  }

  async create(createData: Partial<AppSetting>): Promise<this> {
    const data = this.sanitize<AppSetting>(this.fields, createData);
    try {
      this.appSetting = await this.prisma.appSetting.create({ data: { ...(data as Prisma.AppSettingCreateInput) } });
      this.result = statusTMap.get('Created')!({ data: { appSetting: this.appSetting } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<AppSetting>): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertAppSettingExists();
      const id = this.appSetting.id;
      this.appSetting = await this.prisma.appSetting.update({ where: { id }, data });
      this.result = statusTMap.get('OK')!<'appSetting', AppSetting>({
        message: 'App setting updated',
        data: { appSetting: this.appSetting },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertAppSettingExists();
      const id = this.appSetting.id;
      const deletedAppSetting = await this.prisma.appSetting.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedAppSetting, recoverable: this.softDelete } },
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

  assertAppSettingExists(): asserts this is this & { appSetting: AppSetting } {
    if (!this.appSetting || !this.appSetting.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  unset() {
    this.appSetting = null;
  }
}
