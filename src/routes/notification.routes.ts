import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all notifications for current user
router.post('/', notificationController.createSingleNotification);
router.post('/all', notificationController.createNotificationForAllUsers); // Fixed - was using wrong controller
router.post('/bulk', notificationController.bulkCreateNotifications); // Updated to use renamed controller method


router.get('/', notificationController.getMyNotifications);
// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark all notifications as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// Delete all read notifications
router.delete('/delete-all-read', notificationController.deleteAllRead);

// Mark notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

export default router;