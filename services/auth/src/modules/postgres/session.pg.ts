import { Prisma, Session, User } from '@prisma/client';
import { PostgresDBService, TPagination } from './common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { TUserWithIncludes } from './user.pg';

export type TSessionWithIncludes = Session & {
  userData?: User[] | TUserWithIncludes[];
};

export type TSessionFilters = {
  filters?: Prisma.SessionWhereInput;
  orderBy?: Prisma.SessionOrderByWithRelationInput | Prisma.SessionOrderByWithRelationInput[];
  include?: Prisma.SessionInclude;
  exclude?: Array<keyof Session>;
};

export class SessionPostgresService extends PostgresDBService<'session' | 'sessions', Session> {
  session: Session | null;
  fields = ['id', 'ip', 'user', 'csrfToken', 'loginType', 'expiresAt', 'created', 'updated'];

  constructor({ softDelete = false, session = undefined }: { softDelete?: boolean; session?: Session }) {
    super({ softDelete });
    this.session = session ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TSessionFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include: this.getIncludes(include),
      };
      const [sessions, total] = await this.prisma.$transaction([
        this.prisma.session.findMany({ ...q }),
        this.prisma.session.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'sessions', Session>({
        data: { sessions, meta: { filters, orderBy, page, limit, total, pages, prev, next, include } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TSessionFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include: this.getIncludes(include) };
      const [sessions, total] = await this.prisma.$transaction([
        this.prisma.session.findMany({ ...q }),
        this.prisma.session.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'sessions', Session>({
        data: { sessions, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.SessionInclude }): Promise<this> {
    try {
      const q = { where: { id }, include: this.getIncludes(include) };
      this.session = await this.prisma.session.findUnique({ ...q });
      this.result = this.session
        ? statusTMap.get('OK')!<'session', Session>({
            data: { session: this.session, meta: { filters: q.where, include } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TSessionFilters) {
    try {
      const session = await this.prisma.session.findFirst({ where: { ...filters }, include, orderBy });
      this.result = session
        ? statusTMap.get('OK')!<'session', Session>({ data: { session, meta: { filters, include, orderBy } } })
        : statusTMap.get('NotFound')!({ data: { meta: filters, include, orderBy } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async search(): Promise<this> {
    return this;
  }

  async create(createData: Partial<Session>, include?: Prisma.SessionInclude): Promise<this> {
    const data = this.sanitize<Session>(this.fields, createData);
    try {
      this.session = await this.prisma.session.create({
        data: { ...(data as Prisma.SessionCreateInput) },
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('Created')!({ data: { session: this.session } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<Session>, include?: Prisma.SessionInclude): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertSessionExists();
      const id = this.session.id;
      this.session = await this.prisma.session.update({ where: { id }, data, include: this.getIncludes(include) });
      this.result = statusTMap.get('OK')!<'session', Session>({
        message: 'App setting updated',
        data: { session: this.session },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertSessionExists();
      const id = this.session.id;
      const deletedSession = await this.prisma.session.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedSession, recoverable: this.softDelete } },
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

  private assertSessionExists(): asserts this is this & { session: Session } {
    if (!this.session || !this.session.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  private unset() {
    this.session = null;
  }

  private getIncludes(include?: Prisma.SessionInclude) {
    const countInclude: Prisma.SessionInclude = {
      userData: true,
    };
    return { ...include, ...countInclude };
  }
}
