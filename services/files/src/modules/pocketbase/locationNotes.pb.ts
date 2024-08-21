import { RecordOptions } from '@neoncoder/pocketbase';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';
import { getPocketBase } from '../../lib/pocketbase';
import { LocationNote } from '../../lib/pocketbase.types';
import PBService from './common.pb';

export class LocationNotePocketbaseService extends PBService<'locationNote' | 'locationNotes', LocationNote> {
  locationNote: LocationNote | null;
  fields = [
    'id',
    'note',
    'type',
    'author',
    'details',
    'location',
    'isSystemNote',
    'measurementFile',
    'created',
    'updated',
  ];
  constructor({ isAdmin = false, locationNote }: { isAdmin?: boolean; locationNote?: LocationNote; token?: string }) {
    const pocketbaseInstance = isAdmin ? getPocketBase(isAdmin) : undefined;
    super('locationNotes', pocketbaseInstance);
    this.locationNote = locationNote ?? null;
  }

  async createLocationNote({ createData, options }: { createData: Partial<LocationNote>; options?: RecordOptions }) {
    const data = this.sanitize<LocationNote>(this.fields, createData);
    try {
      this.locationNote = await this.create<LocationNote>({ data, options });
      this.result = statusTMap.get('OK')!<'locationNote', LocationNote>({
        data: { locationNote: this.locationNote, meta: { ...this.requestMeta(options) } },
        message: 'LocationNote Created Successfully',
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findLocationNoteById({ id, options }: { id: string; options?: RecordOptions }) {
    try {
      this.locationNote = await this.getOne<LocationNote>({ id, options });
      this.result = statusTMap.get('OK')!<'locationNote', LocationNote>({
        data: { locationNote: this.locationNote, meta: { ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async updateLocationNote({ updateData, options }: { updateData: Partial<LocationNote>; options?: RecordOptions }) {
    const data = this.sanitize<LocationNote>(this.fields, updateData);
    console.log(data, updateData);
    try {
      this.assertLocationNoteExists();
      this.locationNote = await this.update<LocationNote>({ id: this.locationNote.id, data, options });
      this.result = statusTMap.get('OK')!<'locationNote', LocationNote>({
        data: { locationNote: this.locationNote, meta: { ...this.requestMeta(options) } },
      });
    } catch (error: any) {
      console.log({ error });
      this.formatError(error);
    }
    return this;
  }

  private assertLocationNoteExists(): asserts this is this & { locationNote: LocationNote } {
    if (!this.locationNote || !this.locationNote.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }
}
