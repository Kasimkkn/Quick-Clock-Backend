import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { DocumentAttachmentAttributes, DocumentAttachmentCreationAttributes, DocumentPermission } from '../types/collaboration.types';

class DocumentAttachment extends Model<DocumentAttachmentAttributes, DocumentAttachmentCreationAttributes> implements DocumentAttachmentAttributes {
    public id!: string;
    public fileName!: string;
    public fileSize!: number;
    public fileType!: string;
    public url!: string;
    public uploadedBy!: string;
    public projectId?: string;
    public permissions!: DocumentPermission[];
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

DocumentAttachment.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        fileName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        fileSize: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        fileType: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        uploadedBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        projectId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'projects',
                key: 'id',
            },
        },
        permissions: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
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
        tableName: 'document_attachments',
    }
);

export default DocumentAttachment;