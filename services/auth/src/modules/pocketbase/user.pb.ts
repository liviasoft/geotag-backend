import { CommonOptions, RecordFullListOptions, RecordListOptions, RecordOptions } from '@neoncoder/pocketbase';
import { User } from '../../lib/pocketbase.types';
import { TPagination } from '../postgres/common.pg';
import PBService from './common.pb';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { getPocketBase } from '../../lib/pocketbase';
import { getObjectKeys } from '@neoncoder/validator-utils';

export class UserPocketbaseService extends PBService<'user' | 'users', User> {
  user: User | null;

  token: string | null;

  fields = ['username', 'email', 'emailVisibility', 'verified', 'avatar', 'avatarUrl', 'name', 'phone', 'phoneData'];

  constructor({ isAdmin = false, user, token }: { isAdmin?: boolean; user?: User; token?: string }) {
    const pocketbaseInstance = isAdmin ? getPocketBase(isAdmin) : undefined;
    super('users', pocketbaseInstance);
    this.user = user ?? null;
    this.token = token ?? null;
  }

  async getUsers({ page = 1, limit = 50, options }: TPagination & { options?: RecordListOptions }) {
    try {
      const { items, ...rest } = await this.getList<User>({ page, limit, options });
      const { totalPages: pages, totalItems: total } = rest;
      const { prev, next } = this.paginate(pages, page);
      this.result = statusTMap.get('OK')!<'users', User>({
        data: { users: items, meta: { page, limit, prev, next, pages, total, ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findUserById({ id, options }: { id: string; options?: RecordOptions }) {
    try {
      this.user = await this.getOne<User>({ id, options });
      this.result = statusTMap.get('OK')!<'user', User>({
        data: { user: this.user, meta: { ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findUserByUniqueField({
    fieldValue,
    options,
  }: {
    fieldValue: { [key in 'email' | 'username' | 'phone' | 'id']: string };
    options?: RecordListOptions;
  }) {
    try {
      let filter = '';
      getObjectKeys(fieldValue).forEach((f) => (filter += `${f}="${fieldValue[f]}"`));
      this.user = await this.getFirstListItem<User>({ filter, options });
      this.result = statusTMap.get('OK')!<'user', User>({
        data: { user: this.user, meta: { ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async searchUsers(options?: RecordFullListOptions) {
    try {
      const users = await this.getFullList<User>({ options: {} });
      this.result = statusTMap.get('OK')!<'users'>({ data: { users, meta: { ...this.requestMeta(options) } } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async createUser({ createData, options }: { createData: Partial<User>; options?: RecordOptions }) {
    const data = this.sanitize<User>(this.fields, createData);
    try {
      this.user = await this.create<User>({ data, options });
      this.result = statusTMap.get('OK')!<'user', User>({
        data: { user: this.user, meta: { ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async updateUser({ updateData, options }: { updateData: Partial<User>; options?: RecordOptions }) {
    const data = this.sanitize<User>(this.fields, updateData);
    try {
      this.assertUserExists();
      await this.update({ id: this.user.id, data, options });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async deleteUser(options: CommonOptions) {
    try {
      this.assertUserExists();
      await this.delete({ id: this.user.id, options });
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
        record: user,
        meta,
      } = await this.pb.collection(this.collection).authWithPassword<User>(identity, password);
      this.set({ user, token });
      this.result = statusTMap.get('OK')!<'user', User>({ data: { user, meta: { ...meta } } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async saveAuth(token: string, user: User) {
    this.pb.authStore.save(token, user);
    this.set({ user, token });
    return this;
  }

  private set({ user, token }: { user?: User | null; token?: string }) {
    this.user = user ?? null;
    this.token = token ?? null;
  }

  async refreshAuth() {
    try {
      const { record: user, token, meta } = await this.pb.collection(this.collection).authRefresh<User>();
      this.set({ user, token });
      this.result = statusTMap.get('OK')!<'user', User>({ data: { user, meta } });
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
      this.assertUserIsLoggedIn();
      this.pb.authStore.clear();
      this.set({});
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  private assertUserExists(): asserts this is this & { user: User } {
    if (!this.user || !this.user.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  assertUserIsLoggedIn(): asserts this is this & { user: User; token: string } {
    this.assertUserExists();
    if (!this.token || !this.checkAuth()) {
      throw new CustomErrorByType({ type: 'Unauthorized', message: 'You need to be logged in to do this' });
    }
  }
}
