import { Prisma, FeatureFlag, Feature } from '@prisma/client';
import { PostgresDBService, TPagination } from '../common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { TFeatureWithIncludes } from './features.pg';

export type TFeatureFlagWithIncludes = FeatureFlag & { featureData?: Feature | TFeatureWithIncludes };

export type TFeatureFlagFilters = {
  filters?: Prisma.FeatureFlagWhereInput;
  orderBy?: Prisma.FeatureFlagOrderByWithRelationInput | Prisma.FeatureFlagOrderByWithRelationInput[];
  include?: Prisma.FeatureFlagInclude;
  exclude?: Array<keyof FeatureFlag>;
};

export class FeatureFlagPostgresService extends PostgresDBService<'featureFlag' | 'featureFlags', FeatureFlag> {
  featureFlag: FeatureFlag | null;
  fields = ['id', 'feature', 'name', 'description', 'active', 'created', 'updated'];

  constructor({ softDelete = false, featureFlag = undefined }: { softDelete?: boolean; featureFlag?: FeatureFlag }) {
    super({ softDelete });
    this.featureFlag = featureFlag ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TFeatureFlagFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include,
      };
      const [featureFlags, total] = await this.prisma.$transaction([
        this.prisma.featureFlag.findMany({ ...q }),
        this.prisma.featureFlag.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'featureFlags', FeatureFlag>({
        data: { featureFlags, meta: { filters, orderBy, page, limit, total, pages, prev, next } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TFeatureFlagFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include };
      const [featureFlags, total] = await this.prisma.$transaction([
        this.prisma.featureFlag.findMany({ ...q }),
        this.prisma.featureFlag.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'featureFlags', FeatureFlag>({
        data: { featureFlags, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.FeatureFlagInclude }): Promise<this> {
    try {
      const q = { where: { id }, include };
      this.featureFlag = await this.prisma.featureFlag.findUnique({ ...q });
      this.result = this.featureFlag
        ? statusTMap.get('OK')!<'featureFlag', FeatureFlag>({
            data: { featureFlag: this.featureFlag, meta: { filters: q } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TFeatureFlagFilters) {
    try {
      const featureFlag = await this.prisma.featureFlag.findFirst({ where: { ...filters }, include, orderBy });
      this.result = featureFlag
        ? statusTMap.get('OK')!<'featureFlag', FeatureFlag>({
            data: { featureFlag, meta: { filters, include, orderBy } },
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

  async create(createData: Partial<FeatureFlag>, include?: Prisma.FeatureFlagInclude): Promise<this> {
    const data = this.sanitize<FeatureFlag>(this.fields, createData);
    try {
      this.featureFlag = await this.prisma.featureFlag.create({
        data: { ...(data as Prisma.FeatureFlagCreateInput) },
        include,
      });
      this.result = statusTMap.get('Created')!({ data: { featureFlag: this.featureFlag } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<FeatureFlag>, include?: Prisma.FeatureFlagInclude): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertFeatureFlagExists();
      const id = this.featureFlag.id;
      this.featureFlag = await this.prisma.featureFlag.update({ where: { id }, data, include });
      this.result = statusTMap.get('OK')!<'featureFlag', FeatureFlag>({
        message: 'App setting updated',
        data: { featureFlag: this.featureFlag },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertFeatureFlagExists();
      const id = this.featureFlag.id;
      const deletedFeatureFlag = await this.prisma.featureFlag.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedFeatureFlag, recoverable: this.softDelete } },
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

  private assertFeatureFlagExists(): asserts this is this & { featureFlag: FeatureFlag } {
    if (!this.featureFlag || !this.featureFlag.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  private unset() {
    this.featureFlag = null;
  }
}
