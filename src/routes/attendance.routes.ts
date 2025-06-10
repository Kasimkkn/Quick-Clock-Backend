// src/routes/attendance.routes.ts
import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Employee routes
router.post('/check-in', authenticate, attendanceController.checkIn);
router.post('/check-out', authenticate, attendanceController.checkOut);
router.get('/my-records', authenticate, attendanceController.getMyAttendanceHistory);
router.get('/today', authenticate, attendanceController.getTodayAttendance);

// Admin routes
router.get('/', authenticate, attendanceController.getAllEmployeeAttendance);
router.get('/employee/:employeeId', authenticate, attendanceController.getEmployeeAttendance);
router.get('/date/:date', authenticate, attendanceController.getAttendanceByDate);
router.post('/manually-update', authenticate, attendanceController.manuallyAddEditAttendance);
router.delete('/delete/:id', authenticate, attendanceController.deleteAttendance);

export default router;