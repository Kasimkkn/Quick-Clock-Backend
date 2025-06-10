import { Optional } from 'sequelize';

export interface NotificationAttributes {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'leave' | 'task' | 'holiday' | 'system' | "message" | "project" | "meeting";
    referenceId?: string;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'isRead' | 'createdAt' | 'updatedAt'> { }

export interface NotificationUpdateAttributes {
    isRead?: boolean;
}