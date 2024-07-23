import { CommonOptions, RecordFullListOptions, RecordListOptions, RecordOptions } from '@neoncoder/pocketbase';
import { Contact } from '../../lib/pocketbase.types';
import { TPagination } from '../postgres/common.pg';
import PBService from './common.pb';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { getPocketBase } from '../../lib/pocketbase';
import { getObjectKeys } from '@neoncoder/validator-utils';

export class ContactPocketbaseService extends PBService<'contact' | 'contacts', Contact> {
  contact: Contact | null;

  token: string | null;

  fields = ['id', 'name', 'email', 'phone', 'address', 'addedBy', 'created', 'updated'];

  constructor({ isAdmin = false, contact, token }: { isAdmin?: boolean; contact?: Contact; token?: string }) {
    const pocketbaseInstance = isAdmin ? getPocketBase(isAdmin) : undefined;
    super('contacts', pocketbaseInstance);
    this.contact = contact ?? null;
    this.token = token ?? null;
  }

  async getContacts({ page = 1, limit = 50, options }: TPagination & { options?: RecordListOptions }) {
    try {
      const { items, ...rest } = await this.getList<Contact>({ page, limit, options });
      const { totalPages: pages, totalItems: total } = rest;
      const { prev, next } = this.paginate(pages, page);
      this.result = statusTMap.get('OK')!<'contacts', Contact>({
        data: { contacts: items, meta: { page, limit, prev, next, pages, total, ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findContactById({ id, options }: { id: string; options?: RecordOptions }) {
    try {
      this.contact = await this.getOne<Contact>({ id, options });
      this.result = statusTMap.get('OK')!<'contact', Contact>({
        data: { contact: this.contact, meta: { ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findContactByUniqueField({
    fieldValue,
    options,
  }: {
    fieldValue: { [key in 'phone' | 'email' | 'name' | 'id']?: string };
    options?: RecordListOptions;
  }) {
    try {
      let filter = '';
      getObjectKeys(fieldValue).forEach(
        (f, i) => (filter += i === 0 ? `${f}="${fieldValue[f]}"` : ` || ${f}="${fieldValue[f]}"`),
      );
      console.log({ filter });
      this.contact = await this.getFirstListItem<Contact>({ filter, options });
      this.result = statusTMap.get('OK')!<'contact', Contact>({
        data: { contact: this.contact, meta: { ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async searchContacts(options?: RecordFullListOptions) {
    try {
      const contacts = await this.getFullList<Contact>({ options: {} });
      this.result = statusTMap.get('OK')!<'contacts'>({
        data: { contacts, meta: { ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async createContact({ createData, options }: { createData: Partial<Contact>; options?: RecordOptions }) {
    const data = this.sanitize<Contact>(this.fields, createData);
    try {
      this.contact = await this.create<Contact>({ data, options });
      this.result = statusTMap.get('OK')!<'contact', Contact>({
        data: { contact: this.contact, meta: { ...this.requestMeta(options) } },
        message: 'Contact Created',
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async updateContact({ updateData, options }: { updateData: Partial<Contact>; options?: RecordOptions }) {
    const data = this.sanitize<Contact>(this.fields, updateData);
    try {
      this.assertContactExists();
      await this.update({ id: this.contact.id, data, options });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async deleteContact(options: CommonOptions) {
    try {
      this.assertContactExists();
      await this.delete({ id: this.contact.id, options });
      this.set({});
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async passwordLogin({ identity, password }: { identity: string; password: string }) {
    try {
      const {
        token,
        record: contact,
        meta,
      } = await this.pb.collection(this.collection).authWithPassword<Contact>(identity, password);
      this.set({ contact, token });
      this.result = statusTMap.get('OK')!<'contact', Contact>({ data: { contact, meta: { ...meta } } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async saveAuth(token: string, contact: Contact) {
    this.pb.authStore.save(token, contact);
    this.set({ contact, token });
    return this;
  }

  private set({ contact, token }: { contact?: Contact | null; token?: string }) {
    this.contact = contact ?? null;
    this.token = token ?? null;
  }

  async refreshAuth() {
    try {
      const { record: contact, token, meta } = await this.pb.collection(this.collection).authRefresh<Contact>();
      this.set({ contact, token });
      this.result = statusTMap.get('OK')!<'contact', Contact>({ data: { contact, meta } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  checkAuth() {
    return this.pb.authStore.isValid;
  }

  async logout() {
    try {
      this.assertContactIsLoggedIn();
      this.pb.authStore.clear();
      this.set({});
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  private assertContactExists(): asserts this is this & { contact: Contact } {
    if (!this.contact || !this.contact.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  assertContactIsLoggedIn(): asserts this is this & { contact: Contact; token: string } {
    this.assertContactExists();
    if (!this.token || !this.checkAuth()) {
      throw new CustomErrorByType({ type: 'Unauthorized', message: 'You need to be logged in to do this' });
    }
  }
}
