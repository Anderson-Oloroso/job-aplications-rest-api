import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller.js';

const router = Router();

router.post('/', ApplicationController.create);
router.get('/', ApplicationController.getAll);
router.put('/:id/status', ApplicationController.updateStatus);

export default router;