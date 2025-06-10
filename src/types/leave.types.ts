import { Optional } from "sequelize";

type LeaveType = 'sick' | 'casual' | 'paid' | 'unpaid' | 'other';
type LeaveStatus = 'pending' | 'approved' | 'rejected';

interface LeaveAttributes {
    id: string;
    employeeId: string;
    startDate: string;
    endDate: string;
    type: LeaveType;
    reason: string;
    status: LeaveStatus;
    approvedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface LeaveCreationAttributes extends Optional<LeaveAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

export { LeaveAttributes, LeaveCreationAttributes, LeaveType, LeaveStatus };