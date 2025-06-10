import { Request, Response } from 'express';
import { Notification } from '../models/notification.model';
import { createMultipleNotifications } from '../services/notification.services';
import { User } from '../models';

export const createSingleNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { message, title, type, userId } = req.body;

        if (!userId) {
            res.status(400).json({ message: 'User id is required' });
            return; // Added missing return
        }

        if (!message || !title || !type) {
            res.status(400).json({ message: 'Message, title and type are required' });
            return; // Added missing return
        }

        const response = await Notification.create({ message, title, type, userId });
        res.status(201).json(response); // Changed status code to 201 for creation
    }
    catch (error) {
        console.error('Error creating notification:', error); // Changed to console.error
        res.status(500).json({ message: 'Failed to create notification' }); // Added proper error response
    }
};

export const createNotificationForAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { message, title, type, referenceId } = req.body;

        if (!message || !title || !type) {
            res.status(400).json({ message: 'Message, title and type are required' });
            return; // Added missing return
        }

        const users = await getUserIds(); // You'll need to implement this function to get all user IDs

        const notificationData = { message, title, type, referenceId };
        const response = await createMultipleNotifications(users, notificationData);

        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error creating notifications for all users:', error);
        res.status(500).json({ message: 'Failed to create notifications' });
    }
};

// Renamed to avoid naming conflict with the service function
export const bulkCreateNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userIds, data } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            res.status(400).json({ message: 'User IDs array is required' });
            return;
        }

        if (!data || !data.message || !data.title || !data.type) {
            res.status(400).json({ message: 'Notification data with message, title and type are required' });
            return;
        }

        const response = await createMultipleNotifications(userIds, data);
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error creating multiple notifications:', error);
        res.status(500).json({ message: 'Failed to create notifications' });
    }
};

// Helper function to get all user IDs (implementation depends on your app)
const getUserIds = async (): Promise<string[]> => {
    let userId = [];
    try {
        const users = await User.findAll();
        userId = users.map((user) => user.id);
        if (userId.length > 0) {
            return userId;
        }
    } catch (error) {
        console.log('Error fetching user IDs:', error);
    }
    return [];
};

// Get all notifications for the current user
export const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const { limit = 20, offset = 0, unreadOnly } = req.query;

        const whereClause: any = { userId: req.userId };

        // Filter to only show unread notifications if requested
        if (unreadOnly === 'true') {
            whereClause.isRead = false;
        }

        const notifications = await Notification.findAndCountAll({
            where: whereClause,
            limit: Number(limit),
            offset: Number(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Notifications retrieved successfully',
            count: notifications.count,
            notifications: notifications.rows
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error while fetching notifications' });
    }
};

// Get unread notification count for the current user
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
        const count = await Notification.count({
            where: {
                userId: req.userId,
                isRead: false
            }
        });

        res.status(200).json({
            message: 'Unread notification count retrieved successfully',
            count
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ message: 'Server error while fetching unread count' });
    }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOne({
            where: {
                id,
                userId: req.userId
            }
        });

        if (!notification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error while updating notification' });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        await Notification.update(
            { isRead: true },
            {
                where: {
                    userId: req.userId,
                    isRead: false
                }
            }
        );

        res.status(200).json({
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server error while updating notifications' });
    }
};

// Delete a notification
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOne({
            where: {
                id,
                userId: req.userId
            }
        });

        if (!notification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }

        await notification.destroy();

        res.status(200).json({
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Server error while deleting notification' });
    }
};

// Delete all read notifications
export const deleteAllRead = async (req: Request, res: Response): Promise<void> => {
    try {
        await Notification.destroy({
            where: {
                userId: req.userId,
                isRead: true
            }
        });

        res.status(200).json({
            message: 'All read notifications deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting read notifications:', error);
        res.status(500).json({ message: 'Server error while deleting notifications' });
    }
};