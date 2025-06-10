import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { DiscussionThreadAttributes, DiscussionThreadCreationAttributes } from '../types/collaboration.types';

class DiscussionThread extends Model<DiscussionThreadAttributes, DiscussionThreadCreationAttributes> implements DiscussionThreadAttributes {
    public id!: string;
    public projectId!: string;
    public title!: string;
    public createdBy!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public lastActivity!: Date;
    public commentCount!: number;
}

DiscussionThread.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        projectId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'projects',
                key: 'id',
            },
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
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
        lastActivity: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        commentCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: 'discussion_threads',
    }
);


export default DiscussionThread;