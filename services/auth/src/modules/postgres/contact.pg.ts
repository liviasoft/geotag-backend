import { Prisma, Contact, Location } from '@prisma/client';
import { PostgresDBService, TPagination } from './common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { TLocationWithIncludes } from './location.pg';

export type TContactWithIncludes = Contact & {
  locations?: Location[] | TLocationWithIncludes[];
};

export type TContactFilters = {
  filters?: Prisma.ContactWhereInput;
  orderBy?: Prisma.ContactOrderByWithRelationInput | Prisma.ContactOrderByWithRelationInput[];
  include?: Prisma.ContactInclude;
  exclude?: Array<keyof Contact>;
};

export class ContactPostgresService extends PostgresDBService<'contact' | 'contacts', Contact> {
  contact: Contact | null;
  fields = ['id', 'email', 'phone', 'name', 'address', 'addedBy', 'created', 'updated'];

  constructor({ softDelete = false, contact = undefined }: { softDelete?: boolean; contact?: Contact }) {
    super({ softDelete });
    this.contact = contact ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TContactFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include: this.getIncludes(include),
      };
      const [contacts, total] = await this.prisma.$transaction([
        this.prisma.contact.findMany({ ...q }),
        this.prisma.contact.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'contacts', Contact>({
        data: { contacts, meta: { filters, orderBy, page, limit, total, pages, prev, next, include } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TContactFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include: this.getIncludes(include) };
      const [contacts, total] = await this.prisma.$transaction([
        this.prisma.contact.findMany({ ...q }),
        this.prisma.contact.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'contacts', Contact>({
        data: { contacts, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.ContactInclude }): Promise<this> {
    try {
      const q = { where: { id }, include: this.getIncludes(include) };
      this.contact = await this.prisma.contact.findUnique({ ...q });
      this.result = this.contact
        ? statusTMap.get('OK')!<'contact', Contact>({
            data: { contact: this.contact, meta: { filters: q.where, include } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TContactFilters) {
    try {
      const contact = await this.prisma.contact.findFirst({ where: { ...filters }, include, orderBy });
      this.result = contact
        ? statusTMap.get('OK')!<'contact', Contact>({ data: { contact, meta: { filters, include, orderBy } } })
        : statusTMap.get('NotFound')!({ data: { meta: filters, include, orderBy } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async search(): Promise<this> {
    return this;
  }

  async create(createData: Partial<Contact>, include?: Prisma.ContactInclude): Promise<this> {
    const data = this.sanitize<Contact>(this.fields, createData);
    try {
      this.contact = await this.prisma.contact.create({
        data: { ...(data as Prisma.ContactCreateInput) },
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('Created')!({ data: { contact: this.contact } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<Contact>, include?: Prisma.ContactInclude): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertContactExists();
      const id = this.contact.id;
      this.contact = await this.prisma.contact.update({ where: { id }, data, include: this.getIncludes(include) });
      this.result = statusTMap.get('OK')!<'contact', Contact>({
        message: 'App setting updated',
        data: { contact: this.contact },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertContactExists();
      const id = this.contact.id;
      const deletedContact = await this.prisma.contact.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedContact, recoverable: this.softDelete } },
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

  private assertContactExists(): asserts this is this & { contact: Contact } {
    if (!this.contact || !this.contact.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  private unset() {
    this.contact = null;
  }

  private getIncludes(include?: Prisma.ContactInclude) {
    const countInclude: Prisma.ContactInclude = {
      _count: { select: { locations: true } },
    };
    return { ...include, ...countInclude };
  }
}
