import { Request, Response } from 'express';
import { User } from '../models';
import { Project } from '../models/project.model';
import ProjectUpdate from '../models/projectUpdates.model';
import { extractStringParam } from '../utils/query.utils';
import DocumentAttachment from '../models/documentAttachment.model';

// Updated validation function for attachments
const validateAttachments = (attachments: any): string | null => {
    if (!attachments) {
        return null;
    }

    if (!Array.isArray(attachments)) {
        return 'Attachments must be an array';
    }

    for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];

        // Validate required fields according to DocumentAttachmentAttributes
        if (!attachment.fileName || typeof attachment.fileName !== 'string') {
            return `Attachment ${i + 1}: fileName is required and must be a string`;
        }

        if (typeof attachment.fileSize !== 'number' || attachment.fileSize < 0) {
            return `Attachment ${i + 1}: fileSize must be a positive number`;
        }

        if (!attachment.fileType || typeof attachment.fileType !== 'string') {
            return `Attachment ${i + 1}: fileType is required and must be a string`;
        }

        if (!attachment.url || typeof attachment.url !== 'string') {
            return `Attachment ${i + 1}: url is required and must be a string`;
        }

        if (!attachment.uploadedBy || typeof attachment.uploadedBy !== 'string') {
            return `Attachment ${i + 1}: uploadedBy is required and must be a string`;
        }

        // Validate permissions array
        if (!Array.isArray(attachment.permissions)) {
            return `Attachment ${i + 1}: permissions must be an array`;
        }

        for (let j = 0; j < attachment.permissions.length; j++) {
            const permission = attachment.permissions[j];

            if (!permission.userId || typeof permission.userId !== 'string') {
                return `Attachment ${i + 1}, Permission ${j + 1}: userId is required and must be a string`;
            }

            if (!permission.access || !['view', 'edit', 'delete'].includes(permission.access)) {
                return `Attachment ${i + 1}, Permission ${j + 1}: access must be one of 'view', 'edit', 'delete'`;
            }
        }

        // Optional: Validate URL format
        try {
            new URL(attachment.url);
        } catch {
            return `Attachment ${i + 1}: url must be a valid URL`;
        }

        // Optional: Validate file size limit (e.g., 50MB)
        if (attachment.fileSize > 50 * 1024 * 1024) {
            return `Attachment ${i + 1}: file size cannot exceed 50MB`;
        }
    }

    return null;
};

// Updated validation functions
const validateContent = (content: string): string | null => {
    if (!content || typeof content !== 'string') {
        return 'Content is required and must be a string';
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
        return 'Content cannot be empty';
    }

    if (trimmedContent.length > 5000) {
        return 'Content must be less than 5000 characters';
    }

    return null;
};

const validateUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
};

// Get project updates
export const getProjectUpdates = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id: projectId } = req.params;

        // Validate projectId
        if (!projectId || !validateUUID(projectId)) {
            res.status(400).json({
                success: false,
                message: 'Invalid project ID format'
            });
            return;
        }

        // Extract and validate query parameters using utility functions
        const pageParam = extractStringParam(req.query.page);
        const limitParam = extractStringParam(req.query.limit);
        const sortParam = extractStringParam(req.query.sort);

        const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
        const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 10;
        const sort = sortParam === 'asc' ? 'asc' : 'desc';

        // Validate project exists
        const project = await Project.findByPk(projectId);
        if (!project) {
            res.status(404).json({
                success: false,
                message: 'Project not found'
            });
            return;
        }

        const offset = (page - 1) * limit;
        const order = sort === 'asc' ? 'ASC' : 'DESC';

        const { rows: updates, count: total } = await ProjectUpdate.findAndCountAll({
            where: { projectId: projectId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'designation', 'photoUrl', 'fullName'],
                    required: true
                }
            ],
            order: [['createdAt', order]],
            limit: limit,
            offset: offset,
        });

        // Transform the response to match the interface
        const transformedUpdates = updates.map(update => ({
            id: update.id,
            projectId: update.projectId,
            userId: update.userId,
            content: update.content,
            attachments: update.attachments || [],
            createdAt: update.createdAt.toISOString(),
            updatedAt: update.updatedAt.toISOString(),
            user: update.user ? {
                id: update.user.id,
                fullName: update.user.fullName,
                designation: update.user.designation,
                photoUrl: update.user.photoUrl
            } : undefined
        }));

        res.status(200).json({
            success: true,
            updates: transformedUpdates,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error('Error fetching project updates:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};

// Create project update
export const createProjectUpdate = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id: projectId } = req.params;
        const { content, attachments = [] } = req.body;
        const userId = req.user?.id;

        // Validation
        const validationErrors: string[] = [];

        // Validate projectId
        if (!projectId || !validateUUID(projectId)) {
            validationErrors.push('Invalid project ID format');
        }

        // Validate user authentication
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        // Validate content
        const contentError = validateContent(content);
        if (contentError) {
            validationErrors.push(contentError);
        }

        // Validate attachments
        const attachmentsError = validateAttachments(attachments);
        if (attachmentsError) {
            validationErrors.push(attachmentsError);
        }

        // Return validation errors if any
        if (validationErrors.length > 0) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
            return;
        }

        // Validate project exists
        const project = await Project.findByPk(projectId);
        if (!project) {
            res.status(404).json({
                success: false,
                message: 'Project not found'
            });
            return;
        }

        // Validate user exists
        const user = await User.findByPk(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        // Process attachments - add missing fields if needed
        const processedAttachments = attachments.map((attachment: any) => ({
            id: attachment.id || crypto.randomUUID(),
            fileName: attachment.fileName,
            fileSize: attachment.fileSize,
            fileType: attachment.fileType,
            url: attachment.url,
            uploadedBy: attachment.uploadedBy,
            projectId: projectId, // Add projectId to attachment
            permissions: attachment.permissions,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        // Create the project update
        const projectUpdate = await ProjectUpdate.create({
            projectId,
            userId,
            content: content.trim(),
            attachments: processedAttachments
        });

        for (const attachment of processedAttachments) {
            await DocumentAttachment.create({
                fileName: attachment.fileName,
                fileSize: attachment.fileSize,
                fileType: attachment.fileType,
                uploadedBy: attachment.uploadedBy,
                url: attachment.url,
                projectId: attachment.projectId,
                permissions: attachment.permissions
            })
        }
        // Fetch the created update with user information
        const createdUpdate = await ProjectUpdate.findByPk(projectUpdate.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'designation', 'photoUrl', 'fullName'],
                    required: true
                }
            ]
        });

        if (!createdUpdate) {
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve created update'
            });
            return;
        }

        // Transform the response
        const transformedUpdate = {
            id: createdUpdate.id,
            projectId: createdUpdate.projectId,
            userId: createdUpdate.userId,
            content: createdUpdate.content,
            attachments: createdUpdate.attachments || [],
            createdAt: createdUpdate.createdAt.toISOString(),
            updatedAt: createdUpdate.updatedAt.toISOString(),
            user: createdUpdate.user ? {
                id: createdUpdate.user.id,
                fullName: createdUpdate.user.fullName,
                designation: createdUpdate.user.designation,
                photoUrl: createdUpdate.user.photoUrl
            } : undefined
        };

        res.status(201).json({
            success: true,
            message: 'Project update created successfully',
            data: transformedUpdate
        });
    } catch (error) {
        console.error('Error creating project update:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};