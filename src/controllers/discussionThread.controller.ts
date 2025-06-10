import { Request, Response } from 'express';
import DiscussionThread from '../models/discussionThread.model';
import ThreadComment from '../models/threadComment.model';
import { User } from '../models/user.model';
import { Task } from '../models/task.model';
import { extractUuidParam } from '../utils/query.utils';
import { createNotification } from '../services/notification.services';

export const getThreads = async (req: Request, res: Response): Promise<void> => {
    try {
        const projectId = extractUuidParam(req.query.projectId);

        if (!projectId) {
            res.status(400).json({ error: 'Valid Project ID is required' });
            return;
        }

        const threads = await DiscussionThread.findAll({
            where: { projectId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'fullName', 'photoUrl'],
                },
            ],
            order: [['lastActivity', 'DESC']],
        });

        res.status(200).json(threads);
    } catch (error) {
        console.error('Error fetching threads:', error);
        res.status(500).json({ error: 'Failed to fetch discussion threads' });
    }
};

export const createThread = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId, title } = req.body;
        const user = req.user;

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const userId = user.id;
        if (!projectId || !title) {
            res.status(400).json({ error: 'Project ID and title are required' });
            return;
        }

        const thread = await DiscussionThread.create({
            projectId,
            title,
            createdBy: userId,
        });

        // Notify all users assigned to tasks in this project about the new discussion
        const tasks = await Task.findAll({
            where: { projectId },
            attributes: ['assignedTo']
        });

        const userIds = new Set(tasks.map(task => task.assignedTo).filter(id => id !== userId));

        userIds.forEach(async (assignedUserId) => {
            await createNotification({
                userId: assignedUserId,
                title: 'New Discussion Thread',
                message: `A new discussion "${title}" has been started in your project.`,
                type: 'project',
                referenceId: thread.id
            });
        });

        // Fetch the created thread with user info
        const threadWithUser = await DiscussionThread.findByPk(thread.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'fullName', 'photoUrl'],
                },
            ],
        });

        res.status(201).json(threadWithUser);
    } catch (error) {
        console.error('Error creating thread:', error);
        res.status(500).json({ error: 'Failed to create discussion thread' });
    }
};

export const getComments = async (req: Request, res: Response): Promise<void> => {
    try {
        const { threadId } = req.params;

        if (!threadId) {
            res.status(400).json({ error: 'Thread ID is required' });
            return;
        }

        const comments = await ThreadComment.findAll({
            where: { threadId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'fullName', 'designation', 'photoUrl'],
                },
            ],
            order: [['createdAt', 'ASC']],
        });

        res.status(200).json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch thread comments' });
    }
};

export const addComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { threadId } = req.params;
        const { content } = req.body;
        const user = req.user;

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const userId = user.id;
        if (!threadId || !content) {
            res.status(400).json({ error: 'Thread ID and content are required' });
            return;
        }

        // Check if thread exists
        const thread = await DiscussionThread.findByPk(threadId);
        if (!thread) {
            res.status(404).json({ error: 'Thread not found' });
            return;
        }

        // Create comment
        const comment = await ThreadComment.create({
            threadId,
            userId,
            content,
        });

        // Update thread's lastActivity and commentCount
        await thread.update({
            lastActivity: new Date(),
            commentCount: thread.commentCount + 1,
        });

        // Notify thread participants about the new comment (excluding the commenter)
        const existingComments = await ThreadComment.findAll({
            where: { threadId },
            attributes: ['userId'],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id']
                }
            ]
        });

        // Get unique participants (including thread creator)
        const participantIds = new Set([
            thread.createdBy,
            ...existingComments.map(comment => comment.userId)
        ]);

        // Remove the current commenter from notifications
        participantIds.delete(userId);

        participantIds.forEach(async (participantId) => {
            await createNotification({
                userId: participantId,
                title: 'New Comment in Discussion',
                message: `${user.fullName} commented in the discussion "${thread.title}".`,
                type: 'project',
                referenceId: thread.id
            });
        });

        // Fetch the created comment with user info
        const commentWithUser = await ThreadComment.findByPk(comment.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'fullName', 'designation', 'photoUrl'],
                },
            ],
        });

        res.status(201).json(commentWithUser);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment to thread' });
    }
};

export const discussionThreadController = {
    getThreads,
    createThread,
    getComments,
    addComment
};