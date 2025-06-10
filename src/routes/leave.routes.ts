import { Router } from 'express';
import * as leaveController from '../controllers/leave.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Employee routes
router.post('/', authenticate, leaveController.applyForLeave);
router.get('/my-leaves', authenticate, leaveController.getMyLeaves);
router.delete('/:id', authenticate, leaveController.cancelLeave);

// Admin routes
router.get('/', authenticate, leaveController.getAllLeaves);
router.get('/pending', authenticate, leaveController.getPendingLeaves);
router.put('/:id/status', authenticate, leaveController.updateLeaveStatus);

export default router;