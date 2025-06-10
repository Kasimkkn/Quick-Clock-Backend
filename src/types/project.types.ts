import { Optional } from 'sequelize';

export interface ProjectAttributes {
    id: string;
    name: string;
    description: string;
    startDate: Date;
    endDate?: Date;
    status: 'active' | 'completed' | 'on-hold';
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

export interface ProjectUpdateAttributes {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    status?: 'active' | 'completed' | 'on-hold';
}