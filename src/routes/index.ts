// routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import attendanceRoutes from './attendance.routes';
import leaveRoutes from './leave.routes';
import manualRequestRoutes from './manualRequest.routes';
import holidayRoutes from './holiday.routes';
import geofenceRoutes from './geofence.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import notificationRoutes from './notification.routes';
import collaborationRoutes from './collaboration.routes';
import projectUpdateRoutes from './projectUpdates.routes';
const router = Router();

// Register all routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/manual-requests', manualRequestRoutes);
router.use('/holidays', holidayRoutes);
router.use('/geofences', geofenceRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/notifications', notificationRoutes);
router.use('/collaboration', collaborationRoutes);
router.use('/projects', projectUpdateRoutes);

export default router;