import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { NotificationAttributes, NotificationCreationAttributes } from '../types/notification.types';

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
    public id!: string;
    public userId!: string;
    public title!: string;
    public message!: string;
    public type!: 'leave' | 'task' | 'holiday' | 'system' | "message" | "project" | "meeting";
    public referenceId?: string;
    public isRead!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Notification.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('leave', 'task', 'holiday', 'system', "message", "project", "meeting"),
            allowNull: false,
        },
        referenceId: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'ID reference to the related entity (task ID, leave ID, etc.)',
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'notifications',
        indexes: [
            {
                fields: ['userId'],
            },
            {
                fields: ['type'],
            },
            {
                fields: ['isRead'],
            },
        ],
    }
);

export { Notification };
