// src/controllers/manualRequest.controller.ts
import { Request, Response } from 'express';
import { ManualAttendanceRequest } from '../models/manualRequest.model';
import { AttendanceRecord } from '../models/attendance.model';
import { User } from '../models/user.model';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from '../services/notification.services';

// Submit a manual attendance request
export const submitManualRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const employeeId = req.userId as string;
        const employeeDetails = req.user as any;
        const { date, checkInTime, checkOutTime, reason } = req.body;

        if (!date || !reason || (!checkInTime && !checkOutTime)) {
            res.status(400).json({ message: 'Required fields are missing' });
            return;
        }

        // Validate date and times
        const requestDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (requestDate > today) {
            res.status(400).json({ message: 'Cannot request for future dates' });
            return;
        }

        // Check if there's already a pending request for this date
        const existingRequest = await ManualAttendanceRequest.findOne({
            where: {
                employeeId,
                date,
                status: 'pending'
            }
        });

        if (existingRequest) {
            res.status(400).json({ message: 'A pending request already exists for this date' });
            return;
        }

        // Check existing attendance record
        const existingRecord = await AttendanceRecord.findOne({
            where: {
                employeeId,
                date
            }
        });

        const request = await ManualAttendanceRequest.create({
            id: uuidv4(),
            employeeId,
            date,
            checkInTime,
            checkOutTime,
            reason,
            type: existingRecord ? 'edit' : 'new',
            status: 'pending'
        });

        // Notify employee about successful request submission
        await createNotification({
            userId: employeeId,
            title: 'Manual Attendance Request Submitted',
            message: `Your request for ${existingRecord ? 'editing' : 'adding'} attendance on ${new Date(date).toLocaleDateString()} has been submitted and is awaiting approval.`,
            type: 'system',
            referenceId: request.id
        });

        // Notify admins about new manual attendance request
        const admins = await User.findAll({ where: { role: 'admin' } });
        for (const admin of admins) {
            await createNotification({
                userId: admin.id,
                title: 'New Manual Attendance Request',
                message: `Employee ${employeeDetails.fullName ? employeeDetails.fullName : employeeId} has requested to ${existingRecord ? 'edit' : 'add'} attendance for ${new Date(date).toLocaleDateString()}.`,
                type: 'system',
                referenceId: request.id
            });
        }

        res.status(201).json({ message: 'Manual attendance request submitted successfully', request });
    } catch (error) {
        console.error('Error submitting manual request:', error);
        res.status(500).json({ message: 'Server error while submitting manual attendance request' });
    }
};

// Get my manual requests
export const getMyManualRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const employeeId = req.userId as string;

        const requests = await ManualAttendanceRequest.findAll({
            where: { employeeId },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(requests);
    } catch (error) {
        console.error('Error getting manual requests:', error);
        res.status(500).json({ message: 'Server error while fetching manual requests' });
    }
};

// Get all manual requests (admin only)
export const getAllManualRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const requests = await ManualAttendanceRequest.findAll({
            include: [
                {
                    model: User,
                    as: 'employee',
                    attributes: ['id', 'fullName', 'email', 'department']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(requests);
    } catch (error) {
        console.error('Error getting all manual requests:', error);
        res.status(500).json({ message: 'Server error while fetching manual requests' });
    }
};

// Get pending manual requests (admin only)
export const getPendingManualRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const requests = await ManualAttendanceRequest.findAll({
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

        res.status(200).json(requests);
    } catch (error) {
        console.error('Error getting pending manual requests:', error);
        res.status(500).json({ message: 'Server error while fetching pending manual requests' });
    }
};

// Approve or reject manual request (admin only)
export const processManualRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const requestId = req.params.id;
        const { status } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            res.status(400).json({ message: 'Invalid status' });
            return;
        }

        const request = await ManualAttendanceRequest.findByPk(requestId);

        if (!request) {
            res.status(404).json({ message: 'Request not found' });
            return;
        }

        // Update request status
        request.status = status as 'approved' | 'rejected';
        await request.save();

        // If approved, update or create attendance record
        if (status === 'approved') {
            let attendanceRecord = await AttendanceRecord.findOne({
                where: {
                    employeeId: request.employeeId,
                    date: request.date
                }
            });

            if (attendanceRecord) {
                // Update existing record
                if (request.checkInTime) attendanceRecord.checkInTime = request.checkInTime;
                if (request.checkOutTime) attendanceRecord.checkOutTime = request.checkOutTime;
                attendanceRecord.manuallyAdded = true;
                await attendanceRecord.save();
            } else if (request.checkInTime || request.checkOutTime) {
                // Create new record
                attendanceRecord = await AttendanceRecord.create({
                    id: uuidv4(),
                    employeeId: request.employeeId,
                    date: request.date,
                    checkInTime: request.checkInTime!,
                    checkOutTime: request.checkOutTime,
                    manuallyAdded: true,
                });
            }
        }

        // Notify employee about request status update
        const requestType = request.type === 'edit' ? 'edit' : 'add new';
        const actionMessage = status === 'approved'
            ? `Your request to ${requestType} attendance for ${new Date(request.date).toLocaleDateString()} has been approved.`
            : `Your request to ${requestType} attendance for ${new Date(request.date).toLocaleDateString()} has been rejected.`;

        await createNotification({
            userId: request.employeeId,
            title: `Manual Attendance Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: actionMessage,
            type: 'system',
            referenceId: request.id
        });

        res.status(200).json({
            message: `Manual attendance request ${status}`,
            request
        });
    } catch (error) {
        console.error('Error processing manual request:', error);
        res.status(500).json({ message: 'Server error while processing manual request' });
    }
};

// Cancel a manual request (employee can cancel their own pending requests)
export const cancelManualRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestId = req.params.id;
        const employeeId = req.userId as string;
        const employeeDetails = req.user as any;

        const request = await ManualAttendanceRequest.findByPk(requestId);

        if (!request) {
            res.status(404).json({ message: 'Request not found' });
            return;
        }

        // Check if it's the employee's own request and it's still pending
        if (request.employeeId !== employeeId) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        if (request.status !== 'pending') {
            res.status(400).json({ message: 'Cannot cancel a request that has already been processed' });
            return;
        }

        // Notify admins about request cancellation
        const admins = await User.findAll({ where: { role: 'admin' } });
        for (const admin of admins) {
            await createNotification({
                userId: admin.id,
                title: 'Manual Attendance Request Cancelled',
                message: `Employee ${employeeDetails.fullName ? employeeDetails.fullName : employeeId} has cancelled their manual attendance request for ${new Date(request.date).toLocaleDateString()}.`,
                type: 'system',
                referenceId: requestId
            });
        }

        await request.destroy();

        res.status(200).json({ message: 'Manual attendance request cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling manual request:', error);
        res.status(500).json({ message: 'Server error while cancelling manual request' });
    }
};