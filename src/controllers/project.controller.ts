import { Request, Response } from 'express';
import { Project } from '../models/project.model';
import { Task } from '../models/task.model';
import { User } from '../models/user.model';
import { createNotification } from '../services/notification.services';

// Get all projects
export const getAllProjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const projects = await Project.findAll({
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'fullName', 'email']
                },
                {
                    model: Task,
                    as: 'tasks',
                    attributes: ['id', 'title', 'status']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Projects retrieved successfully',
            projects
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Server error while fetching projects' });
    }
};

// Get project by ID
export const getProjectById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const project = await Project.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'fullName', 'email']
                },
                {
                    model: Task,
                    as: 'tasks',
                    include: [
                        {
                            model: User,
                            as: 'assignee',
                            attributes: ['id', 'fullName', 'email']
                        }
                    ]
                }
            ]
        });

        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        res.status(200).json({
            message: 'Project retrieved successfully',
            project
        });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ message: 'Server error while fetching project' });
    }
};

// Create new project (Admin only)
export const createProject = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(403).json({ message: 'You are not authorized to create projects' });
            return;
        }

        const { name, description, startDate, endDate, status } = req.body;

        if (!name || !description || !startDate) {
            res.status(400).json({ message: 'Name, description, and start date are required' });
            return;
        }

        const newProject = await Project.create({
            name,
            description,
            startDate,
            endDate: endDate || null,
            status: status || 'active',
            createdBy: req.userId!
        });

        res.status(201).json({
            message: 'Project created successfully',
            project: newProject
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ message: 'Server error while creating project' });
    }
};

// Update project (Admin only)
export const updateProject = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(403).json({ message: 'You are not authorized to update projects' });
            return;
        }

        const { id } = req.params;
        const { name, description, startDate, endDate, status } = req.body;

        const project = await Project.findByPk(id);
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        if (name) project.name = name;
        if (description) project.description = description;
        if (startDate) project.startDate = new Date(startDate);
        if (endDate !== undefined) project.endDate = endDate ? new Date(endDate) : undefined;
        if (status && ['active', 'completed', 'on-hold'].includes(status)) project.status = status;

        await project.save();

        if (status === 'completed') {
            // Notify all users assigned to tasks in this project
            const tasks = await Task.findAll({
                where: { projectId: id },
                attributes: ['assignedTo']
            });

            const userIds = new Set(tasks.map(task => task.assignedTo));

            userIds.forEach(async (userId) => {
                await createNotification({
                    userId,
                    title: 'Project Completed',
                    message: `The project "${project.name}" has been marked as completed.`,
                    type: 'system',
                    referenceId: project.id
                });
            });
        }

        res.status(200).json({
            message: 'Project updated successfully',
            project
        });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ message: 'Server error while updating project' });
    }
};

// Delete project (Admin only)
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(403).json({ message: 'You are not authorized to delete projects' });
            return;
        }

        const { id } = req.params;
        const project = await Project.findByPk(id);

        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        // Check if there are any tasks associated with this project
        const tasksCount = await Task.count({ where: { projectId: id } });
        if (tasksCount > 0) {
            res.status(400).json({
                message: 'Cannot delete project with existing tasks. Please delete all tasks first or move them to another project.'
            });
            return;
        }

        await project.destroy();
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Server error while deleting project' });
    }
};