import { NextFunction, Request, Response } from 'express';
import { LocationNotePostgresService } from '../modules/postgres/locationNotes.pg';
import { statusTypes, TStatus } from '@neoncoder/typed-service-response';
import { LocationNotePocketbaseService } from '../modules/pocketbase/locationNotes.pb';
import { isNotEmpty } from '@neoncoder/validator-utils';
import { LocationNote, Prisma } from '@prisma/client';

export const getLocationNotesHandler = async (req: Request, res: Response) => {
  console.log('Reached here');
  const limit = parseInt(req.query.limit as string, 10) ? parseInt(req.query.limit as string, 10) : 25;
  const page = parseInt(req.query.page as string, 10) ? parseInt(req.query.page as string, 10) : 1;
  const from = req.query.from ? new Date(req.query.from as string) : new Date();
  const locnotepgs = new LocationNotePostgresService({});
  let result: TStatus<'locationNotes'>;
  if (req.query.page) {
    result = (
      await locnotepgs.getList({
        page,
        limit,
        filters: { AND: [{ location: req.params.locationId }] },
        orderBy: { created: 'desc' },
        include: { authorData: true, locationData: true, measurementFileData: true },
      })
    ).result! as TStatus<'locationNotes'>;
  } else {
    result = (
      await locnotepgs.getList({
        limit,
        filters: { AND: [{ created: { lte: from } }, { location: req.params.locationId }] },
        orderBy: { created: 'desc' },
        include: { authorData: true, locationData: true, measurementFileData: true },
      })
    ).result! as TStatus<'locationNotes'>;
  }
  const sr = statusTypes.get(result?.statusType)!({ ...result });
  return res.status(sr.statusCode).send(sr);
};

export const addLocationNoteHandler = async (req: Request, res: Response) => {
  const locnotepbs = await new LocationNotePocketbaseService({ isAdmin: true }).adminAuth();
  const result = (
    await locnotepbs.createLocationNote({ createData: { ...req.body, type: 'MESSAGE', author: res.locals.user.id } })
  ).result!;
  const sr = statusTypes.get(result?.statusType)!({ ...result });
  return res.status(sr.statusCode).send(sr);
};

export const updateLocationNoteHandler = async (req: Request, res: Response) => {
  const locnotepgs = new LocationNotePostgresService({ locationNote: res.locals.locationNote });
  if (res.locals?.locationNote?.author !== res.locals?.user?.id) {
    const sr = statusTypes.get('Unauthorized')!({ message: `Unauthorized to perform this action` });
    return res.status(sr.statusCode).send(sr);
  }
  const result = (await locnotepgs.update(req.body)).result!;
  const sr = statusTypes.get(result.statusType)!({ ...result });
  return res.status(sr.statusCode).send(sr);
};

export const deleteLocationNoteHandler = async (req: Request, res: Response) => {
  const locnotepgs = await new LocationNotePocketbaseService({ locationNote: res.locals.locationNote }).adminAuth();
  if (res.locals?.locationNote?.author !== res.locals?.user?.id) {
    const sr = statusTypes.get('Unauthorized')!({ message: `Unauthorized to perform this action` });
    return res.status(sr.statusCode).send(sr);
  }
  const result = await locnotepgs.delete({ id: res.locals.locationNote.id });
  const sr = statusTypes.get(result ? 'OK' : 'BadRequest')!({
    message: result ? 'Note Deleted' : 'Error deleting note',
    data: { locationNote: res.locals.locationNote },
  });
  return res.status(sr.statusCode).send(sr);
};

export const searchLocationNotesHandler = async (req: Request, res: Response) => {
  const { q } = req.query;
  const limit = parseInt(req.query.limit as string, 10) ? parseInt(req.query.limit as string, 10) : 25;
  const page = parseInt(req.query.page as string, 10) ? parseInt(req.query.page as string, 10) : 25;
  const locnotepgs = new LocationNotePostgresService({});
  const filters: Prisma.LocationNoteWhereInput = {};
  const OR: { [key: string]: any }[] = locnotepgs.buildQueryFilters(req.query);
  if (q && isNotEmpty(String(q))) {
    filters.AND = [
      {
        OR: [
          { note: { contains: String(q), mode: 'insensitive' } },
          {
            authorData: {
              OR: [
                { username: { contains: String(q), mode: 'insensitive' } },
                { email: { contains: String(q), mode: 'insensitive' } },
              ],
            },
          },
        ],
      },
      ...OR,
    ];
  } else {
    filters.AND = [...OR];
  }
  let result: TStatus<'locations'>;
  if (req.query.page) {
    result = (
      await locnotepgs.getList({
        page,
        limit,
        filters,
        orderBy: { created: 'desc' },
        include: { authorData: true, locationData: true, measurementFileData: true },
      })
    ).result!;
  } else {
    result = (
      await locnotepgs.getFullList({
        filters,
        orderBy: { created: 'desc' },
        include: { authorData: true, locationData: true, measurementFileData: true },
      })
    ).result!;
  }
  const sr = statusTypes.get(result.statusType)!({ ...result });
  return res.status(sr.statusCode).send(sr);
};

export const noteExists = async (req: Request, res: Response, next: NextFunction, noteId: string) => {
  const result = (await new LocationNotePostgresService({}).findById({ id: noteId }))
    .result! as TStatus<'locationNote'>;
  if (result?.data?.locationNote) {
    res.locals.locationNote = result.data.locationNote as LocationNote;
    return next();
  }
  const sr = statusTypes.get(result?.statusType)!({ ...result });
  return res.status(sr.statusCode).send(sr);
};
