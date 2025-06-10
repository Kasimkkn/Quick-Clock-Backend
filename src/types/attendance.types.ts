import { Optional } from "sequelize";

interface AttendanceRecordAttributes {
    id: string;
    employeeId: string;
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    locationLatitude?: number;
    locationLongitude?: number;
    locationTimestamp?: string;
    isWithinFence?: boolean;
    lateCheckoutReason?: string;
    manuallyAdded?: boolean;
    manuallyEdited?: boolean;
    autoCheckout?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface AttendanceRecordCreationAttributes extends Optional<AttendanceRecordAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

export { AttendanceRecordAttributes, AttendanceRecordCreationAttributes };
