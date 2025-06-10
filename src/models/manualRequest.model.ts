import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { ManualAttendanceRequestAttributes, ManualAttendanceRequestCreationAttributes } from '../types/manualRequest.types';

class ManualAttendanceRequest extends Model<ManualAttendanceRequestAttributes, ManualAttendanceRequestCreationAttributes> implements ManualAttendanceRequestAttributes {
    public id!: string;
    public employeeId!: string;
    public date!: string;
    public checkInTime?: string;
    public checkOutTime?: string;
    public reason!: string;
    public status!: 'pending' | 'approved' | 'rejected';
    public type!: 'new' | 'edit';
    public originalRecordId?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

ManualAttendanceRequest.init(
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
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        checkInTime: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        checkOutTime: {
            type: DataTypes.TIME,
            allowNull: true,
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
        type: {
            type: DataTypes.ENUM('new', 'edit'),
            allowNull: false,
        },
        originalRecordId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'attendance_records',
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
        tableName: 'manual_attendance_requests',
    }
);

export { ManualAttendanceRequest };
