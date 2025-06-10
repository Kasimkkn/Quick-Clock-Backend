import { Request, Response } from 'express';
import { Leave } from '../models/leave.model';
import { User } from '../models/user.model';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { createNotification } from '../services/notification.services';

export const applyForLeave = async (req: Request, res: Response): Promise<void> => {
    try {
        const employeeId = req.userId as string;
        const employeeDetails = req.user as any;
        const { startDate, endDate, type, reason } = req.body;

        if (!startDate || !endDate || !type || !reason) {
            res.status(201).json({ message: 'All fields are required' });
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            res.status(201).json({ message: 'End date must be after start date' });
            return;
        }

        const overlappingLeaves = await Leave.findAll({
            where: {
                employeeId,
                [Op.or]: [
                    { startDate: { [Op.lte]: start }, endDate: { [Op.gte]: start } },
                    { startDate: { [Op.lte]: end }, endDate: { [Op.gte]: end } },
                    { startDate: { [Op.gte]: start }, endDate: { [Op.lte]: end } }
                ]
            }
        });

        if (overlappingLeaves.length > 0) {
            res.status(201).json({ message: 'Leave Alredy Exists on this date' });
            return;
        }

        const leave = await Leave.create({
            id: uuidv4(),
            employeeId,
            startDate,
            endDate,
            type,
            reason,
            status: 'pending'
        });

        await createNotification({
            userId: employeeId,
            title: 'Leave Application Submitted',
            message: `Your leave request from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()} has been submitted and is awaiting approval.`,
            type: 'system',
            referenceId: leave.id
        });

        const admins = await User.findAll({ where: { role: 'admin' } });
        for (const admin of admins) {
            await createNotification({
                userId: admin.id,
                title: 'New Leave Application',
                message: `Employee ${employeeDetails.fullName ? employeeDetails.fullName : employeeId} has applied for ${type} leave from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`,
                type: 'system',
                referenceId: leave.id
            });
        }
        res.status(201).json({ message: 'Leave applied successfully', leave });
    } catch (error) {
        console.error('Error applying for leave:', error);
        res.status(500).json({ message: 'Server error while applying for leave' });
    }
};

export const getMyLeaves = async (req: Request, res: Response): Promise<void> => {
    try {
        const employeeId = req.userId as string;

        const leaves = await Leave.findAll({
            where: { employeeId },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(leaves);
    } catch (error) {
        console.error('Error getting leaves:', error);
        res.status(500).json({ message: 'Server error while fetching leaves' });
    }
};

// Get all leaves (admin only)
export const getAllLeaves = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const leaves = await Leave.findAll({
            include: [
                {
                    model: User,
                    as: 'employee',
                    attributes: ['id', 'fullName', 'email', 'department']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(leaves);
    } catch (error) {
        console.error('Error getting all leaves:', error);
        res.status(500).json({ message: 'Server error while fetching leaves' });
    }
};

// Get pending leaves (admin only)
export const getPendingLeaves = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const leaves = await Leave.findAll({
            where: { status: 'pending' },
            include: [
                {
                    model: User,
                    as: 'employee',
                    attributes: ['id', 'fullName', 'email', 'department']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(leaves);
    } catch (error) {
        console.error('Error getting pending leaves:', error);
        res.status(500).json({ message: 'Server error while fetching pending leaves' });
    }
};

// Approve or reject leave (admin only)
export const updateLeaveStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const leaveId = req.params.id;
        const { status } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            res.status(400).json({ message: 'Invalid status' });
            return;
        }

        const leave = await Leave.findByPk(leaveId);

        if (!leave) {
            res.status(404).json({ message: 'Leave not found' });
            return;
        }

        leave.status = status as 'approved' | 'rejected';
        leave.approvedBy = req.userId as string;
        await leave.save();

        res.status(200).json({ message: `Leave ${status} successfully`, leave });
    } catch (error) {
        console.error('Error updating leave status:', error);
        res.status(500).json({ message: 'Server error while updating leave status' });
    }
};

// Cancel a leave application (employee can cancel their own pending leaves)
export const cancelLeave = async (req: Request, res: Response): Promise<void> => {
    try {
        const leaveId = req.params.id;
        const employeeId = req.userId as string;
        const employeeDetails = req.user as any;

        const leave = await Leave.findByPk(leaveId);

        if (!leave) {
            res.status(404).json({ message: 'Leave not found' });
            return;
        }

        // Check if it's the employee's own leave and it's still pending
        if (leave.employeeId !== employeeId) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        if (leave.status !== 'pending') {
            res.status(400).json({ message: 'Cannot cancel a leave that has already been processed' });
            return;
        }

        const admins = await User.findAll({ where: { role: 'admin' } });
        for (const admin of admins) {
            await createNotification({
                userId: admin.id,
                title: 'Leave Application Cancelled',
                message: `Employee ${employeeDetails.fullName ? employeeDetails.fullName : employeeId} has cancelled their leave request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()}.`,
                type: 'system',
                referenceId: leaveId
            });
        }

        await leave.destroy();

        res.status(200).json({ message: 'Leave cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling leave:', error);
        res.status(500).json({ message: 'Server error while cancelling leave' });
    }
};

