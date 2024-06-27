import { Prisma, Feature, Scope, FeatureFlag, UserFeatureBan } from '@prisma/client';
import { PostgresDBService, TPagination } from '../common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';

export type TFeatureWithIncludes = Feature & {
  scopeData?: Scope;
  featureFlags?: FeatureFlag[];
  userBans?: UserFeatureBan[];
};

export type TFeatureFilters = {
  filters?: Prisma.FeatureWhereInput;
  orderBy?: Prisma.FeatureOrderByWithRelationInput | Prisma.FeatureOrderByWithRelationInput[];
  include?: Prisma.FeatureInclude;
  exclude?: Array<keyof Feature>;
};

export class FeaturePostgresService extends PostgresDBService<'feature' | 'features', Feature> {
  feature: Feature | null;
  fields = ['id', 'name', 'description', 'active', 'scope', 'created', 'updated'];

  constructor({ softDelete = false, feature = undefined }: { softDelete?: boolean; feature?: Feature }) {
    super({ softDelete });
    this.feature = feature ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TFeatureFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include: this.getIncludes(include),
      };
      const [features, total] = await this.prisma.$transaction([
        this.prisma.feature.findMany({ ...q }),
        this.prisma.feature.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'features', Feature>({
        data: { features, meta: { filters, orderBy, page, limit, total, pages, prev, next } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TFeatureFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include: this.getIncludes(include) };
      const [features, total] = await this.prisma.$transaction([
        this.prisma.feature.findMany({ ...q }),
        this.prisma.feature.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'features', Feature>({
        data: { features, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.FeatureInclude }): Promise<this> {
    try {
      const q = { where: { id }, include: this.getIncludes(include) };
      this.feature = await this.prisma.feature.findUnique({ ...q });
      this.result = this.feature
        ? statusTMap.get('OK')!<'feature', Feature>({
            data: { feature: this.feature, meta: { filters: q } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TFeatureFilters) {
    try {
      const feature = await this.prisma.feature.findFirst({ where: { ...filters }, include, orderBy });
      this.result = feature
        ? statusTMap.get('OK')!<'feature', Feature>({ data: { feature, meta: { filters, include, orderBy } } })
        : statusTMap.get('NotFound')!({ data: { meta: filters, include, orderBy } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async search(): Promise<this> {
    return this;
  }

  async create(createData: Partial<Feature>, include?: Prisma.FeatureInclude): Promise<this> {
    const data = this.sanitize<Feature>(this.fields, createData);
    try {
      this.feature = await this.prisma.feature.create({
        data: { ...(data as Prisma.FeatureCreateInput) },
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('Created')!({ data: { feature: this.feature } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<Feature>, include?: Prisma.FeatureInclude): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertFeatureExists();
      const id = this.feature.id;
      this.feature = await this.prisma.feature.update({ where: { id }, data, include: this.getIncludes(include) });
      this.result = statusTMap.get('OK')!<'feature', Feature>({
        message: 'App setting updated',
        data: { feature: this.feature },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertFeatureExists();
      const id = this.feature.id;
      const deletedFeature = await this.prisma.feature.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedFeature, recoverable: this.softDelete } },
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

  private assertFeatureExists(): asserts this is this & { feature: Feature } {
    if (!this.feature || !this.feature.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  private unset() {
    this.feature = null;
  }

  private getIncludes(include?: Prisma.FeatureInclude) {
    const countInclude: Prisma.FeatureInclude = {
      _count: { select: { featureFlags: true } },
    };
    return { ...include, ...countInclude };
  }
}
