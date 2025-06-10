import { Request, Response } from 'express';
import { Task } from '../models/task.model';
import { Project } from '../models/project.model';
import { User } from '../models/user.model';
import { createNotification } from '../services/notification.services';

// Get all tasks
export const getAllTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId, assignedTo, status } = req.query;

        // Build filter object based on query parameters
        const filter: any = {};
        if (projectId) filter.projectId = projectId;
        if (assignedTo) filter.assignedTo = assignedTo;
        if (status) filter.status = status;

        const tasks = await Task.findAll({
            where: filter,
            include: [
                {
                    model: User,
                    as: 'assignee',
                    attributes: ['id', 'fullName', 'email', 'photoUrl']
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'fullName', 'email']
                },
                {
                    model: Project,
                    as: 'project',
                    attributes: ['id', 'name', 'status']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Tasks retrieved successfully',
            tasks
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Server error while fetching tasks' });
    }
};

// Get tasks assigned to current user
export const getMyTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status } = req.query;

        // Build filter object based on query parameters
        const filter: any = { assignedTo: req.userId };
        if (status) filter.status = status;

        const tasks = await Task.findAll({
            where: filter,
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'fullName', 'email']
                },
                {
                    model: Project,
                    as: 'project',
                    attributes: ['id', 'name', 'status']
                }
            ],
            order: [['dueDate', 'ASC'], ['priority', 'DESC']]
        });

        res.status(200).json({
            message: 'Tasks retrieved successfully',
            tasks
        });
    } catch (error) {
        console.error('Error fetching my tasks:', error);
        res.status(500).json({ message: 'Server error while fetching tasks' });
    }
};

// Get task by ID
export const getTaskById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const task = await Task.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'assignee',
                    attributes: ['id', 'fullName', 'email', 'photoUrl']
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'fullName', 'email']
                },
                {
                    model: Project,
                    as: 'project',
                    attributes: ['id', 'name', 'description', 'status']
                }
            ]
        });

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        res.status(200).json({
            message: 'Task retrieved successfully',
            task
        });
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ message: 'Server error while fetching task' });
    }
};

// Create new task (Admin only)
export const createTask = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(403).json({ message: 'You are not authorized to create tasks' });
            return;
        }

        const { title, description, status, priority, projectId, assigneeId, dueDate } = req.body;

        if (!title || !description || !projectId || !assigneeId) {
            res.status(400).json({ message: 'Title, description, project ID, and assignee are required' });
            return;
        }

        // Check if project exists
        const project = await Project.findByPk(projectId);
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        // Check if assignee exists
        const assignee = await User.findByPk(assigneeId);
        if (!assignee) {
            res.status(404).json({ message: 'Assignee not found' });
            return;
        }

        const newTask = await Task.create({
            title,
            description,
            status: status || 'todo',
            priority: priority || 'medium',
            projectId,
            assignedTo: assigneeId,
            project: project,
            createdBy: req.userId!,
            dueDate: dueDate || null
        });
        await createNotification({
            userId: assigneeId,
            title: 'New Task Assigned',
            message: `You have been assigned a new task: "${title}" in project "${project.name}"`,
            type: 'task',
            referenceId: newTask.id
        });

        const taskWithDetails = await Task.findByPk(newTask.id, {
            include: [
                {
                    model: User,
                    as: 'assignee',
                    attributes: ['id', 'fullName', 'email']
                },
                {
                    model: Project,
                    as: 'project',
                    attributes: ['id', 'name']
                }
            ]
        });

        res.status(201).json({
            message: 'Task created successfully',
            task: taskWithDetails
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Server error while creating task' });
    }
};

// Update task status (Both admin and assigned user)
export const updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['todo', 'in-progress', 'completed', 'blocked'].includes(status)) {
            res.status(400).json({ message: 'Valid status is required (todo, in-progress, completed, blocked)' });
            return;
        }

        const task = await Task.findByPk(id, {
            include: [
                {
                    model: Project,
                    as: 'project',
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        // Check if user is authorized to update task
        if (req.userId !== task.assignedTo && !req.isAdmin) {
            res.status(403).json({ message: 'You are not authorized to update this task' });
            return;
        }

        const oldStatus = task.status;
        task.status = status;
        await task.save();

        // Access project info safely through the association
        const projectName = task.project?.name || 'Unknown Project';

        // Notify admin about status change if changed by assignee
        if (req.userId === task.assignedTo && req.userId !== task.createdBy) {
            await createNotification({
                userId: task.createdBy,
                title: 'Task Status Updated',
                message: `Status of task "${task.title}" in project "${projectName}" changed from ${oldStatus} to ${status}`,
                type: 'task',
                referenceId: task.id
            });
        }

        // Notify assignee if status changed by admin
        if (req.userId !== task.assignedTo && status === 'completed') {
            await createNotification({
                userId: task.assignedTo,
                title: 'Task Completed',
                message: `Your task "${task.title}" in project "${projectName}" has been marked as completed`,
                type: 'task',
                referenceId: task.id
            });
        }

        res.status(200).json({
            message: 'Task status updated successfully',
            task
        });
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).json({ message: 'Server error while updating task status' });
    }
};

// Update task (Admin only)
export const updateTask = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(403).json({ message: 'You are not authorized to update tasks' });
            return;
        }

        const { id } = req.params;
        const { title, description, status, priority, assigneeId, dueDate, isActive } = req.body;

        const task = await Task.findByPk(id);
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        // Track if the assignee changed
        const assigneeChanged = assigneeId && assigneeId !== task.assignedTo;
        const oldAssignee = task.assignedTo;

        // Check if new assignee exists
        if (assigneeChanged) {
            const newAssignee = await User.findByPk(assigneeId);
            if (!newAssignee) {
                res.status(404).json({ message: 'New assignee not found' });
                return;
            }
        }

        if (title) task.title = title;
        if (description) task.description = description;
        if (status && ['todo', 'in-progress', 'completed', 'blocked'].includes(status)) {
            task.status = status;
        }
        if (priority && ['low', 'medium', 'high'].includes(priority)) {
            task.priority = priority;
        }
        if (assigneeId) task.assignedTo = assigneeId;
        if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : undefined;
        if (isActive !== undefined) task.isActive = isActive;
        await task.save();

        // Send notification if task was reassigned
        if (assigneeChanged) {
            const project = await Project.findByPk(task.projectId);

            // Notify new assignee
            await createNotification({
                userId: assigneeId,
                title: 'Task Assigned',
                message: `You have been assigned task "${task.title}" in project "${project?.name || 'Unknown'}"`,
                type: 'task',
                referenceId: task.id
            });

            // Notify old assignee if they're different
            await createNotification({
                userId: oldAssignee,
                title: 'Task Reassigned',
                message: `Task "${task.title}" has been reassigned to another team member`,
                type: 'task',
                referenceId: task.id
            });
        }

        const updatedTask = await Task.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'assignee',
                    attributes: ['id', 'fullName', 'email']
                },
                {
                    model: Project,
                    as: 'project',
                    attributes: ['id', 'name']
                }
            ]
        });

        res.status(200).json({
            message: 'Task updated successfully',
            task: updatedTask
        });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Server error while updating task' });
    }
};

// Delete task (Admin only)
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(403).json({ message: 'You are not authorized to delete tasks' });
            return;
        }

        const { id } = req.params;
        const task = await Task.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'assignee',
                    attributes: ['id']
                }
            ]
        });

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        // Notify assignee about task deletion
        await createNotification({
            userId: task.assignedTo,
            title: 'Task Deleted',
            message: `Task "${task.title}" has been deleted`,
            type: 'task',
            referenceId: ''
        });

        await task.destroy();
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Server error while deleting task' });
    }
};

export const requestTaskUpdate = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        console.log('id', id);
        const userId = req.userId;
        const task = await Task.findByPk(id);
        const { title, description } = req.body
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        const user = await User.findByPk(userId);
        if (!user) {
            res.status(404).json({ message: 'Requesting User not found' });
            return;
        }
        const admins = await User.findAll({ where: { role: 'admin' } });

        for (const admin of admins) {
            await createNotification({
                userId: admin.id,
                title: 'Task Update Requested',
                message: `Task "${task.title}" has been requested for update by ${user.fullName} for title: ${title} and description: ${description}`,
                type: 'task',
                referenceId: task.id
            });
        }

        res.status(200).json({ message: 'Task update request sent successfully' });

    } catch (error) {
        console.log('Error requesting task update:', error);
        res.status(500).json({ message: 'Server error while requesting task update' });
    }
}