import { CommonOptions, RecordFullListOptions, RecordListOptions, RecordOptions } from '@neoncoder/pocketbase';
import { LocationType } from '../../lib/pocketbase.types';
import { TPagination } from '../postgres/common.pg';
import PBService from './common.pb';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { getPocketBase } from '../../lib/pocketbase';
import { getObjectKeys } from '@neoncoder/validator-utils';

export class LocationTypePocketbaseService extends PBService<'locationType' | 'locationTypes', LocationType> {
  locationType: LocationType | null;

  token: string | null;

  fields = ['id', 'name', 'description', 'icon', 'created', 'updated'];

  constructor({
    isAdmin = false,
    locationType,
    token,
  }: {
    isAdmin?: boolean;
    locationType?: LocationType;
    token?: string;
  }) {
    const pocketbaseInstance = isAdmin ? getPocketBase(isAdmin) : undefined;
    super('locationTypes', pocketbaseInstance);
    this.locationType = locationType ?? null;
    this.token = token ?? null;
  }

  async getLocationTypes({ page = 1, limit = 50, options }: TPagination & { options?: RecordListOptions }) {
    try {
      const { items, ...rest } = await this.getList<LocationType>({ page, limit, options });
      const { totalPages: pages, totalItems: total } = rest;
      const { prev, next } = this.paginate(pages, page);
      this.result = statusTMap.get('OK')!<'locationTypes', LocationType>({
        data: { locationTypes: items, meta: { page, limit, prev, next, pages, total, ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findLocationTypeById({ id, options }: { id: string; options?: RecordOptions }) {
    try {
      this.locationType = await this.getOne<LocationType>({ id, options });
      this.result = statusTMap.get('OK')!<'locationType', LocationType>({
        data: { locationType: this.locationType, meta: { ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findLocationTypeByUniqueField({
    fieldValue,
    options,
  }: {
    fieldValue: { [key in 'name' | 'id']: string };
    options?: RecordListOptions;
  }) {
    try {
      let filter = '';
      getObjectKeys(fieldValue).forEach((f) => (filter += `${f}="${fieldValue[f]}"`));
      this.locationType = await this.getFirstListItem<LocationType>({ filter, options });
      this.result = statusTMap.get('OK')!<'locationType', LocationType>({
        data: { locationType: this.locationType, meta: { ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async searchLocationTypes(options?: RecordFullListOptions) {
    try {
      const locationTypes = await this.getFullList<LocationType>({ options: {} });
      this.result = statusTMap.get('OK')!<'locationTypes'>({
        data: { locationTypes, meta: { ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async createLocationType({ createData, options }: { createData: Partial<LocationType>; options?: RecordOptions }) {
    const data = this.sanitize<LocationType>(this.fields, createData);
    try {
      this.locationType = await this.create<LocationType>({ data, options });
      this.result = statusTMap.get('OK')!<'locationType', LocationType>({
        data: { locationType: this.locationType, meta: { ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async updateLocationType({ updateData, options }: { updateData: Partial<LocationType>; options?: RecordOptions }) {
    const data = this.sanitize<LocationType>(this.fields, updateData);
    try {
      this.assertLocationTypeExists();
      await this.update({ id: this.locationType.id, data, options });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async deleteLocationType(options: CommonOptions) {
    try {
      this.assertLocationTypeExists();
      await this.delete({ id: this.locationType.id, options });
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
        record: locationType,
        meta,
      } = await this.pb.collection(this.collection).authWithPassword<LocationType>(identity, password);
      this.set({ locationType, token });
      this.result = statusTMap.get('OK')!<'locationType', LocationType>({ data: { locationType, meta: { ...meta } } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async saveAuth(token: string, locationType: LocationType) {
    this.pb.authStore.save(token, locationType);
    this.set({ locationType, token });
    return this;
  }

  private set({ locationType, token }: { locationType?: LocationType | null; token?: string }) {
    this.locationType = locationType ?? null;
    this.token = token ?? null;
  }

  async refreshAuth() {
    try {
      const {
        record: locationType,
        token,
        meta,
      } = await this.pb.collection(this.collection).authRefresh<LocationType>();
      this.set({ locationType, token });
      this.result = statusTMap.get('OK')!<'locationType', LocationType>({ data: { locationType, meta } });
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
      this.assertLocationTypeIsLoggedIn();
      this.pb.authStore.clear();
      this.set({});
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  private assertLocationTypeExists(): asserts this is this & { locationType: LocationType } {
    if (!this.locationType || !this.locationType.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  assertLocationTypeIsLoggedIn(): asserts this is this & { locationType: LocationType; token: string } {
    this.assertLocationTypeExists();
    if (!this.token || !this.checkAuth()) {
      throw new CustomErrorByType({ type: 'Unauthorized', message: 'You need to be logged in to do this' });
    }
  }
}
