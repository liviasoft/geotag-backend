import { RecordListOptions } from '@neoncoder/pocketbase';
import { User } from '../../lib/pocketbase.types';
import { TPagination } from '../postgres/common.pg';
import PBService from './common.pb';
import { statusTMap } from '@neoncoder/typed-service-response';
import { getPocketBase } from '../../lib/pocketbase';

export class UserPocketbaseService extends PBService<'user' | 'users', User> {
  constructor({ isAdmin = false }) {
    const pocketbaseInstance = isAdmin ? getPocketBase(isAdmin) : undefined;
    super('users', pocketbaseInstance);
  }

  async getUsers({ page = 1, limit = 50, options }: TPagination & { options?: RecordListOptions }) {
    console.log({ pb: this.pb });
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
}
