import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { ThreadCommentAttributes, ThreadCommentCreationAttributes } from '../types/collaboration.types';

class ThreadComment extends Model<ThreadCommentAttributes, ThreadCommentCreationAttributes> implements ThreadCommentAttributes {
    public id!: string;
    public threadId!: string;
    public userId!: string;
    public content!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

ThreadComment.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        threadId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'discussion_threads',
                key: 'id',
            },
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
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
        tableName: 'thread_comments',
    }
);

export default ThreadComment;