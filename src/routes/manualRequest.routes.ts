// src/routes/manualRequest.routes.ts
import { Router } from 'express';
import * as manualRequestController from '../controllers/manualRequest.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Employee routes
router.post('/', authenticate, manualRequestController.submitManualRequest);
router.get('/my-requests', authenticate, manualRequestController.getMyManualRequests);
router.delete('/:id', authenticate, manualRequestController.cancelManualRequest);

// Admin routes
router.get('/', authenticate, manualRequestController.getAllManualRequests);
router.get('/pending', authenticate, manualRequestController.getPendingManualRequests);
router.put('/:id/process', authenticate, manualRequestController.processManualRequest);

export default router;