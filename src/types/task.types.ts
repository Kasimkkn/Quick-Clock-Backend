import { Optional } from 'sequelize';
import { Project } from '../models/project.model';

export interface TaskAttributes {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'completed' | 'blocked';
    priority: 'low' | 'medium' | 'high';
    projectId: string;
    project?: Project;
    assignedTo: string;
    createdBy: string;
    dueDate?: Date;
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

export interface TaskUpdateAttributes {
    title?: string;
    description?: string;
    status?: 'todo' | 'in-progress' | 'completed' | 'blocked';
    priority?: 'low' | 'medium' | 'high';
    assignedTo?: string;
    dueDate?: Date;
}