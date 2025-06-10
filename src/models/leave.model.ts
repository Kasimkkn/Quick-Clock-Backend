import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { LeaveAttributes, LeaveCreationAttributes, LeaveStatus, LeaveType } from '../types/leave.types';

class Leave extends Model<LeaveAttributes, LeaveCreationAttributes> implements LeaveAttributes {
    public id!: string;
    public employeeId!: string;
    public startDate!: string;
    public endDate!: string;
    public type!: LeaveType;
    public reason!: string;
    public status!: LeaveStatus;
    public approvedBy?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Leave.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        employeeId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('sick', 'casual', 'paid', 'unpaid', 'other'),
            allowNull: false,
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
        },
        approvedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
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
        tableName: 'leaves',
    }
);

export { Leave };
