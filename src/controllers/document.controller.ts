import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { DocumentPermission } from '../types/collaboration.types';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import DocumentAttachment from '../models/documentAttachment.model';
import { User } from '../models';
import { Op, Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();


// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Validate Cloudinary configuration
const validateCloudinaryConfig = (): boolean => {
    return !!(process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
};

// File size limit (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv', 'application/zip', 'application/x-zip-compressed'
];

// Temporary storage configuration (files will be deleted after upload)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/temp');
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp and random string
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, `temp-${uniqueSuffix}${fileExtension}`);
    }
});

// Multer configuration with validation
export const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
            cb(new Error(`File type ${file.mimetype} is not allowed`));
            return;
        }

        // Check filename for security
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9\.\-_]/g, '');
        if (sanitizedName !== file.originalname) {
            cb(new Error('Filename contains invalid characters'));
            return;
        }

        cb(null, true);
    }
});

// Utility function to clean up temporary files
const cleanupTempFile = (filePath: string): void => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up temporary file: ${filePath}`);
        }
    } catch (error) {
        console.error(`Failed to cleanup temporary file ${filePath}:`, error);
    }
};

// Utility function to validate permissions
const validatePermissions = (permissions: any): permissions is DocumentPermission[] => {
    if (!Array.isArray(permissions)) return false;

    return permissions.every(permission =>
        permission &&
        typeof permission.userId === 'string' &&
        permission.userId.trim() !== '' &&
        typeof permission.access === 'string' &&
        ['view', 'edit', 'delete'].includes(permission.access)
    );
};

// Upload file to Cloudinary
const uploadToCloudinary = async (filePath: string, originalName: string): Promise<string> => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'collaboration_documents',
            resource_type: 'auto',
            public_id: `${Date.now()}-${path.parse(originalName).name}`,
            use_filename: false,
            unique_filename: true
        });

        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload file to cloud storage');
    }
};

export const getDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
        const projectIdParam = req.query.projectId;
        const user = req.user;

        // Validate user
        if (!user?.id) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const userId = user.id;

        // Validate projectId
        if (!projectIdParam) {
            res.status(400).json({ error: 'Project ID is required' });
            return;
        }

        // Convert projectId to string explicitly
        let projectId: string;
        if (Array.isArray(projectIdParam)) {
            projectId = String(projectIdParam[0] || '').trim();
        } else {
            projectId = String(projectIdParam).trim();
        }

        if (!projectId) {
            res.status(400).json({ error: 'Invalid Project ID format' });
            return;
        }

        // Validate projectId format (assuming UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(projectId)) {
            res.status(400).json({ error: 'Invalid Project ID format' });
            return;
        }

        const documents = await DocumentAttachment.findAll({
            where: {
                projectId,
                // [Op.or]: [
                //     { uploadedBy: userId }, // User is the owner
                //     Sequelize.literal(`EXISTS (
                //         SELECT 1 FROM jsonb_array_elements(permissions) AS perm
                //         WHERE perm->>'userId' = '${userId}' 
                //         AND perm->>'access' IN ('view', 'edit', 'delete')
                //     )`)
                // ]
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'fullName'],
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            documents,
            total: documents.length
        });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
};

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
    let tempFilePath: string | null = null;

    try {
        // Validate Cloudinary configuration
        if (!validateCloudinaryConfig()) {
            res.status(500).json({ error: 'Cloud storage not configured properly' });
            return;
        }

        // Validate file upload
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        tempFilePath = req.file.path;

        // Validate user
        const user = req.user;
        if (!user?.id) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const userId = user.id;

        // Extract and validate request body
        const { projectId, permissions } = req.body;

        // Validate projectId
        if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
            res.status(400).json({ error: 'Valid Project ID is required' });
            return;
        }

        const trimmedProjectId = projectId.trim();
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(trimmedProjectId)) {
            res.status(400).json({ error: 'Invalid Project ID format' });
            return;
        }

        // Parse and validate permissions
        let parsedPermissions: DocumentPermission[] = [];
        if (permissions) {
            try {
                const permissionsData = typeof permissions === 'string' ? JSON.parse(permissions) : permissions;

                if (!validatePermissions(permissionsData)) {
                    res.status(400).json({
                        error: 'Invalid permissions format. Each permission must have userId and access (view/edit/delete)'
                    });
                    return;
                }

                parsedPermissions = permissionsData;
            } catch (err) {
                console.log('invalid permission')
                res.status(400).json({ error: 'Invalid permissions format' });
            }
        }

        // Validate file properties
        if (!req.file.originalname || req.file.originalname.trim() === '') {
            res.status(400).json({ error: 'Invalid filename' });
            return;
        }

        if (req.file.size > MAX_FILE_SIZE) {
            res.status(400).json({ error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` });
            return;
        }

        // Upload to Cloudinary
        console.log('Uploading file to Cloudinary...');
        const cloudinaryUrl = await uploadToCloudinary(tempFilePath, req.file.originalname);
        console.log('File uploaded successfully to Cloudinary');

        // Create document record
        const document = await DocumentAttachment.create({
            fileName: req.file.originalname.trim(),
            fileSize: req.file.size,
            fileType: req.file.mimetype,
            url: cloudinaryUrl,
            uploadedBy: userId,
            projectId: trimmedProjectId,
            permissions: parsedPermissions
        });

        // Clean up temporary file after successful upload
        cleanupTempFile(tempFilePath);
        tempFilePath = null; // Reset to avoid double cleanup

        // Fetch document with user info
        const documentWithUser = await DocumentAttachment.findByPk(document.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'fullName'],
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            document: documentWithUser
        });
    } catch (error: any) {
        console.error('Error uploading document:', error);

        // Clean up temporary file in case of error
        if (tempFilePath) {
            cleanupTempFile(tempFilePath);
        }

        if (error.message === 'Failed to upload file to cloud storage') {
            res.status(500).json({ error: 'Failed to upload file to cloud storage' });
        } else {
            res.status(500).json({ error: 'Failed to upload document' });
        }
    }
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
    try {
        const { documentId } = req.params;
        const user = req.user;

        // Validate user
        if (!user?.id) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const userId = user.id;

        // Validate documentId
        if (!documentId || typeof documentId !== 'string' || documentId.trim() === '') {
            res.status(400).json({ error: 'Valid Document ID is required' });
            return;
        }

        // Find the document
        const document = await DocumentAttachment.findByPk(documentId.trim());

        if (!document) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }

        // Check if user has permission to delete
        const canDelete = document.uploadedBy === userId ||
            document.permissions.some(p => p.userId === userId && p.access === 'delete');

        if (!canDelete) {
            res.status(403).json({ error: 'You do not have permission to delete this document' });
            return;
        }

        try {
            // Extract public ID from Cloudinary URL
            const urlParts = document.url.split('/');
            const publicIdWithExtension = urlParts[urlParts.length - 1];
            const publicId = publicIdWithExtension.split('.')[0];
            const fullPublicId = `collaboration_documents/${publicId}`;

            // Delete from Cloudinary
            console.log('Deleting file from Cloudinary...');
            const result = await cloudinary.uploader.destroy(fullPublicId);

            if (result.result !== 'ok' && result.result !== 'not found') {
                console.warn('Cloudinary deletion warning:', result);
            }
        } catch (cloudinaryError) {
            console.error('Error deleting from Cloudinary:', cloudinaryError);
            // Continue with database deletion even if Cloudinary deletion fails
        }

        // Delete from database
        await document.destroy();

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
};

export const updateDocumentPermissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { documentId } = req.params;
        const { permissions } = req.body;
        const user = req.user;

        // Validate user
        if (!user?.id) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const userId = user.id;

        // Validate documentId
        if (!documentId || typeof documentId !== 'string' || documentId.trim() === '') {
            res.status(400).json({ error: 'Valid Document ID is required' });
            return;
        }

        // Validate permissions
        if (!validatePermissions(permissions)) {
            res.status(400).json({
                error: 'Invalid permissions format. Permissions must be an array with userId and access (view/edit/delete)'
            });
            return;
        }

        // Find the document
        const document = await DocumentAttachment.findByPk(documentId.trim());

        if (!document) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }

        // Check if user is the owner of the document
        if (document.uploadedBy !== userId) {
            res.status(403).json({ error: 'Only the document owner can update permissions' });
            return;
        }

        // Update permissions
        await document.update({ permissions });

        // Fetch updated document
        const updatedDocument = await DocumentAttachment.findByPk(document.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'fullName'],
                }
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Document permissions updated successfully',
            document: updatedDocument
        });
    } catch (error) {
        console.error('Error updating document permissions:', error);
        res.status(500).json({ error: 'Failed to update document permissions' });
    }
};

export const documentController = {
    getDocuments,
    uploadDocument,
    deleteDocument,
    updateDocumentPermissions
};