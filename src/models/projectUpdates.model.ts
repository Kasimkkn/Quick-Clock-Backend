import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { ProjectUpdateAttributes, ProjectUpdateCreationAttributes } from '../types/projectUpdates.types';
import DocumentAttachment from './documentAttachment.model';


class ProjectUpdate extends Model<ProjectUpdateAttributes, ProjectUpdateCreationAttributes>
    implements ProjectUpdateAttributes {
    public id!: string;
    public projectId!: string;
    public userId!: string;
    public content!: string;
    public attachments?: DocumentAttachment[];
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Association properties
    public user?: {
        id: string;
        fullName: string;
        designation: string;
        photoUrl?: string;
    };
}

ProjectUpdate.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        projectId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'project_id', // Map to database column name
            references: {
                model: 'projects',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'user_id', // Map to database column name
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Content cannot be empty'
                },
                len: {
                    args: [1, 5000],
                    msg: 'Content must be between 1 and 5000 characters'
                }
            }
        },
        attachments: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: [],
            validate: {
                isValidAttachments(value: any) {
                    if (value && Array.isArray(value)) {
                        for (const attachment of value) {
                            // Validate using your existing DocumentAttachmentAttributes structure
                            if (
                                !attachment.fileName ||
                                typeof attachment.fileSize !== 'number' ||
                                !attachment.fileType ||
                                !attachment.url ||
                                !attachment.uploadedBy ||
                                !Array.isArray(attachment.permissions)
                            ) {
                                throw new Error('Invalid attachment format - missing required fields');
                            }

                            // Validate permissions structure
                            for (const permission of attachment.permissions) {
                                if (
                                    !permission.userId ||
                                    !['view', 'edit', 'delete'].includes(permission.access)
                                ) {
                                    throw new Error('Invalid permission format in attachment');
                                }
                            }
                        }
                    }
                }
            }
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'updated_at',
        },
    },
    {
        sequelize,
        modelName: 'ProjectUpdate',
        tableName: 'project_updates',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['project_id']
            },
            {
                fields: ['user_id']
            },
            {
                fields: ['created_at']
            }
        ]
    }
);

export default ProjectUpdate;