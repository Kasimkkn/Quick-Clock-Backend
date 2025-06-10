import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { MeetingAttributes, MeetingCreationAttributes } from '../types/collaboration.types';

class Meeting extends Model<MeetingAttributes, MeetingCreationAttributes> implements MeetingAttributes {
    public id!: string;
    public title!: string;
    public description?: string;
    public startTime!: Date;
    public endTime!: Date;
    public location?: string;
    public isVirtual!: boolean;
    public meetingLink?: string;
    public isRecurring!: boolean;
    public recurringPattern?: string;
    public organizer!: string;
    public attendees!: string[];
    public projectId?: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Meeting.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        startTime: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isVirtual: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        meetingLink: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isRecurring: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        recurringPattern: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        organizer: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        attendees: {
            type: DataTypes.ARRAY(DataTypes.UUID),
            allowNull: false,
        },
        projectId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'projects',
                key: 'id',
            },
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
        tableName: 'meetings',
    }
);

export default Meeting;