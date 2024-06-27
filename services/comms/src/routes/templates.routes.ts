import { Router } from 'express';
import { defaultHandler } from '../controllers/default';
import {
  getMessageTemplatesHandler,
  messageTemplatePreviewHandler,
  testMessageTemplateHandler,
} from '../controllers/template.controllers';
import { checkMessageTemplateExists } from '../middleware/messageTemplates.middleware';

const router = Router({ mergeParams: true });

router.get('/', getMessageTemplatesHandler); // get Templates
router.post('/', defaultHandler); // add Template
router.patch('/:messageTemplateName', defaultHandler); // update Template
router.delete('/:messageTemplateName', defaultHandler); // delete Template
router.get('/:messageTemplateName', defaultHandler); // Get template details
router.get('/:messageTemplateName/test', testMessageTemplateHandler); // test Template (return raw template, compiled template, required fields, values generated)
router.get('/:messageTemplateName/preview', messageTemplatePreviewHandler); // Preview with random data
router.post('/:messageTemplateName/preview', messageTemplatePreviewHandler); // Preview with req.body data;

router.param('messageTemplateName', checkMessageTemplateExists);

export { router as templateRoutes };
