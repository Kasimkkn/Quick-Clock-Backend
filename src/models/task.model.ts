import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { TaskAttributes, TaskCreationAttributes } from '../types/task.types';
import { Project } from './project.model';

class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
    public id!: string;
    public title!: string;
    public description!: string;
    public status!: 'todo' | 'in-progress' | 'completed' | 'blocked';
    public priority!: 'low' | 'medium' | 'high';
    public projectId!: string;
    public assignedTo!: string;
    public createdBy!: string;
    public dueDate?: Date;
    public isActive?: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public project?: Project;
}

Task.init(
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
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('todo', 'in-progress', 'completed', 'blocked'),
            allowNull: false,
            defaultValue: 'todo',
        },
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high'),
            allowNull: false,
            defaultValue: 'medium',
        },
        projectId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'projects',
                key: 'id',
            },
        },
        assignedTo: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        dueDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
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
        tableName: 'tasks',
    }
);
export { Task };
