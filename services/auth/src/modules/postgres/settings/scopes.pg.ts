import { Feature, Prisma, Scope } from '@prisma/client';
import { PostgresDBService, TPagination } from '../common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { TFeatureWithIncludes } from './features.pg';

export type TScopeWithIncludes = Scope & { features?: Feature[] | TFeatureWithIncludes[] };

export type TScopeFilters = {
  filters?: Prisma.ScopeWhereInput;
  orderBy?: Prisma.ScopeOrderByWithRelationInput | Prisma.ScopeOrderByWithRelationInput[];
  include?: Prisma.ScopeInclude;
};

export class ScopePostgresService extends PostgresDBService<'scopes' | 'scope', Scope> {
  scope: Scope | null;
  fields = ['id', 'name', 'description', 'route', 'host', 'active', 'created', 'updated'];

  constructor({ softDelete = false, scope = undefined }: { softDelete?: boolean; scope?: Scope }) {
    super({ softDelete });
    this.scope = scope ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TScopeFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include: this.getIncludes(include),
      };
      const [scopes, total] = await this.prisma.$transaction([
        this.prisma.scope.findMany({ ...q }),
        this.prisma.scope.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'scopes', Scope>({
        data: { scopes, meta: { filters, orderBy, page, limit, total, pages, prev, next } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TScopeFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include: this.getIncludes(include) };
      const [scopes, total] = await this.prisma.$transaction([
        this.prisma.scope.findMany({ ...q }),
        this.prisma.scope.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'scopes', Scope>({
        data: { scopes, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.ScopeInclude }): Promise<this> {
    try {
      const q = { where: { id }, include: this.getIncludes(include) };
      this.scope = await this.prisma.scope.findUnique({ ...q });
      this.result = this.scope
        ? statusTMap.get('OK')!<'scope', Scope>({
            data: { scope: this.scope, meta: { filters: q } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TScopeFilters) {
    try {
      const scope = await this.prisma.scope.findFirst({ where: { ...filters }, include, orderBy });
      this.result = scope
        ? statusTMap.get('OK')!<'scope', Scope>({ data: { scope, meta: { filters, include, orderBy } } })
        : statusTMap.get('NotFound')!({ data: { meta: filters, include, orderBy } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async search(): Promise<this> {
    return this;
  }

  async create(createData: Partial<Scope>, include?: Prisma.ScopeInclude): Promise<this> {
    const data = this.sanitize<Scope>(this.fields, createData);
    try {
      this.scope = await this.prisma.scope.create({
        data: { ...(data as Prisma.ScopeCreateInput) },
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('Created')!({ data: { scope: this.scope } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<Scope>, include?: Prisma.ScopeInclude): Promise<this> {
    const sanitizedData = this.sanitize(this.fields, updateData);
    const data = this.removeKeys(sanitizedData, ['id']);
    console.log({ updateData, sanitizedData });
    console.log({ data });
    try {
      this.assertScopeExists();
      const id = this.scope.id;
      this.scope = await this.prisma.scope.update({ where: { id }, data, include: this.getIncludes(include) });
      this.result = statusTMap.get('OK')!<'scope', Scope>({
        message: 'App setting updated',
        data: { scope: this.scope },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertScopeExists();
      const id = this.scope.id;
      const deletedScope = await this.prisma.scope.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedScope, recoverable: this.softDelete } },
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

  assertScopeExists(): asserts this is this & { scope: Scope } {
    if (!this.scope || !this.scope.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  unset() {
    this.scope = null;
  }

  getIncludes(include?: Prisma.ScopeInclude) {
    const countInclude: Prisma.ScopeInclude = {
      _count: { select: { features: true } },
    };
    return { ...countInclude, ...include };
  }
}
