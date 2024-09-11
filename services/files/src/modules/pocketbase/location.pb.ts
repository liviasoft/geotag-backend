import { RecordOptions } from '@neoncoder/pocketbase';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { getPocketBase } from '../../lib/pocketbase';
import { Location } from '../../lib/pocketbase.types';
import PBService from './common.pb';

export class LocationPocketbaseService extends PBService<'location' | 'locations', Location> {
  location: Location | null;
  fields = [
    'id',
    'name',
    'address',
    'latitude',
    'longitude',
    'description',
    'locationType',
    'city',
    'deviceData',
    'contacts',
    'addedBy',
    'image',
    'connectionStatus',
    'lastConnectionStatusCheck',
    'useRemoteConnection',
    'remoteHTTPUrl',
    'remoteTCPUrl',
    'isLocked',
    'created',
    'updated',
  ];
  constructor({ isAdmin = false, location }: { isAdmin?: boolean; location?: Location; token?: string }) {
    const pocketbaseInstance = isAdmin ? getPocketBase(isAdmin) : undefined;
    super('locations', pocketbaseInstance);
    this.location = location ?? null;
  }

  async createLocation({ createData, options }: { createData: Partial<Location>; options?: RecordOptions }) {
    const data = this.sanitize<Location>(this.fields, createData);
    try {
      this.location = await this.create<Location>({ data, options });
      this.result = statusTMap.get('OK')!<'location', Location>({
        data: { location: this.location, meta: { ...this.requestMeta(options) } },
        message: 'Location Created Successfully',
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findLocationById({ id, options }: { id: string; options?: RecordOptions }) {
    try {
      this.location = await this.getOne<Location>({ id, options });
      this.result = statusTMap.get('OK')!<'location', Location>({
        data: { location: this.location, meta: { ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async updateLocation({ updateData, options }: { updateData: Partial<Location>; options?: RecordOptions }) {
    const data = this.sanitize<Location>(this.fields, updateData);
    console.log(data, updateData);
    try {
      this.assertLocationExists();
      this.location = await this.update<Location>({ id: this.location.id, data, options });
      this.result = statusTMap.get('OK')!<'location', Location>({
        data: { location: this.location, meta: { ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      console.log({ error });
      this.formatError(error);
    }
    return this;
  }

  private assertLocationExists(): asserts this is this & { location: Location } {
    if (!this.location || !this.location.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }
}
