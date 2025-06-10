// notification.service.ts
import { Notification } from '../models/notification.model';
import { NotificationCreationAttributes } from '../types/notification.types';

/**
 * Create a new notification
 * @param notificationData Notification data
 * @returns Created notification
 */
export const createNotification = async (
    notificationData: NotificationCreationAttributes
): Promise<Notification> => {
    try {
        return await Notification.create(notificationData);
    } catch (error) {
        console.error('Error creating notification:', error);
        throw new Error('Failed to create notification');
    }
};

/**
 * Create notifications for multiple users
 * @param userIds Array of user IDs to send notifications to
 * @param data Notification data (excluding userId)
 * @returns Array of created notifications
 */
export const createMultipleNotifications = async (
    userIds: string[],
    data: Omit<NotificationCreationAttributes, 'userId'>
): Promise<Notification[]> => {
    try {
        console.log('Creating notifications for users:', userIds);
        const notifications = await Promise.all(
            userIds.map(userId =>
                Notification.create({
                    ...data,
                    userId
                })
            )
        );
        return notifications;
    } catch (error) {
        console.error('Error creating multiple notifications:', error);
        throw new Error('Failed to create notifications');
    }
};

/**
 * Delete old read notifications (older than specified days)
 * @param days Number of days to keep notifications (default 30)
 * @returns Number of deleted notifications
 */
export const cleanupReadNotifications = async (days = 30): Promise<number> => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const result = await Notification.destroy({
            where: {
                isRead: true,
                createdAt: {
                    [Symbol.for('lt')]: cutoffDate
                }
            }
        });

        return result;
    } catch (error) {
        console.error('Error cleaning up read notifications:', error);
        throw new Error('Failed to clean up notifications');
    }
};