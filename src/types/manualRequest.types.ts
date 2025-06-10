import { Optional } from "sequelize";

interface ManualAttendanceRequestAttributes {
    id: string;
    employeeId: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    type: 'new' | 'edit';
    originalRecordId?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface ManualAttendanceRequestCreationAttributes extends Optional<ManualAttendanceRequestAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

export { ManualAttendanceRequestAttributes, ManualAttendanceRequestCreationAttributes };