import { RecordOptions } from '@neoncoder/pocketbase';
import { statusTMap } from '@neoncoder/typed-service-response';
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
}
