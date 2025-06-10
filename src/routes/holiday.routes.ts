import { Router } from 'express';
import * as holidayController from '../controllers/holiday.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', holidayController.getAllHolidays);

// Admin routes
router.get('/:id', authenticate, holidayController.getHolidayById);
router.post('/', authenticate, holidayController.createHoliday);
router.put('/:id', authenticate, holidayController.updateHoliday);
router.delete('/:id', authenticate, holidayController.deleteHoliday);

export default router;