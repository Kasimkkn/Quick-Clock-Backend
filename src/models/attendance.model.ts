import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { AttendanceRecordAttributes, AttendanceRecordCreationAttributes } from '../types/attendance.types';


class AttendanceRecord extends Model<AttendanceRecordAttributes, AttendanceRecordCreationAttributes> implements AttendanceRecordAttributes {
    public id!: string;
    public employeeId!: string;
    public date!: string;
    public checkInTime!: string;
    public checkOutTime?: string;
    public locationLatitude?: number;
    public locationLongitude?: number;
    public locationTimestamp?: string;
    public isWithinFence?: boolean;
    public lateCheckoutReason?: string;
    public manuallyAdded?: boolean;
    public manuallyEdited?: boolean;
    public autoCheckout?: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

AttendanceRecord.init(
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
            allowNull: false,
        },
        checkOutTime: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        locationLatitude: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        locationLongitude: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        locationTimestamp: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isWithinFence: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        lateCheckoutReason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        manuallyAdded: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        manuallyEdited: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        autoCheckout: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
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
        tableName: 'attendance_records',
        indexes: [
            {
                unique: true,
                fields: ['employeeId', 'date'],
                name: 'idx_employee_date',
            },
        ],
    }
);

export { AttendanceRecord };
