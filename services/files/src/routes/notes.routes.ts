import { Router } from 'express';
import {
  getLocationNotesHandler,
  addLocationNoteHandler,
  updateLocationNoteHandler,
  deleteLocationNoteHandler,
  searchLocationNotesHandler,
  noteExists,
} from '../controllers/notes.controllers';
import { zodValidate } from '../middleware/common.middleware';
import { requireLoggedInUser } from '../middleware/auth';
import { createNoteSchema } from '../utils/schema/notes.schema';

const router = Router({ mergeParams: true });

router.get('/', getLocationNotesHandler);
router.get('/search', searchLocationNotesHandler);
router.post('/', zodValidate(createNoteSchema, 'Create Note'), requireLoggedInUser, addLocationNoteHandler);
router.patch('/:noteId', requireLoggedInUser, updateLocationNoteHandler);
router.delete('/:noteId', requireLoggedInUser, deleteLocationNoteHandler);

router.param('noteId', noteExists);

export { router as locationNoteRoutes };
