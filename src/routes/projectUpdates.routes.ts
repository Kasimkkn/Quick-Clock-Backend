import { Router } from 'express';
import * as projectControllerUpdates from '../controllers/projectUpdates.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/:id/updates', projectControllerUpdates.getProjectUpdates);

router.post('/:id/updates', projectControllerUpdates.createProjectUpdate);


export default router;