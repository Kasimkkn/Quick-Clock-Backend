import { Optional } from 'sequelize';
import DocumentAttachment from '../models/documentAttachment.model';

export interface ProjectUpdateAttributes {
    id: string;
    projectId: string;
    userId: string;
    content: string;
    attachments?: DocumentAttachment[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectUpdateCreationAttributes
    extends Optional<ProjectUpdateAttributes, 'id' | 'createdAt' | 'updatedAt' | 'attachments'> { }

export interface ProjectUpdateAttributes {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    status?: 'active' | 'completed' | 'on-hold';
}