import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models';
import { AttendanceRecord } from '../models/attendance.model';
import { isLocationWithinGeoFence } from '../utils/geofence.util';
import { createNotification } from '../services/notification.services';

export const checkIn = async (req: Request, res: Response): Promise<void> => {
    try {
        const employeeId = req.userId as string;
        const employeeDetails = req.user as any;
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            res.status(200).json({
                message: "Please Provide Latitude and Longitude"
            })
            return;
        }
        const today = new Date().toISOString().split('T')[0];

        const existingRecord = await AttendanceRecord.findOne({
            where: {
                employeeId,
                date: today
            }
        });

        if (existingRecord) {
            res.status(400).json({ message: 'Already checked in today' });
            return;
        }

        let isWithinFence = false;
        if (latitude && longitude) {
            isWithinFence = await isLocationWithinGeoFence({
                latitude,
                longitude,
            });
        }

        const attendanceRecord = await AttendanceRecord.create({
            id: uuidv4(),
            employeeId,
            date: today,
            checkInTime: new Date().toTimeString().split(' ')[0],
            locationLatitude: latitude,
            locationLongitude: longitude,
            locationTimestamp: new Date().toISOString(),
            isWithinFence
        });

        await createNotification({
            userId: employeeId,
            title: 'Check-in Successful',
            message: `You have checked in at ${new Date().toTimeString().split(' ')[0]}.`,
            type: 'system',
            referenceId: attendanceRecord.id
        });

        const admins = await User.findAll({ where: { role: 'admin' } });
        for (const admin of admins) {
            await createNotification({
                userId: admin.id,
                title: 'Employee Check-in',
                message: `Employee ${employeeDetails.fullName ? employeeDetails.fullName : employeeId} has checked in at ${new Date().toTimeString().split(' ')[0]}.`,
                type: 'system',
                referenceId: attendanceRecord.id
            });
        }
        res.status(201).json({
            message: 'Check-in successful',
            attendance: attendanceRecord,
            isWithinFence
        });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ message: 'Server error during check-in' });
    }
};

export const checkOut = async (req: Request, res: Response): Promise<void> => {
    try {
        const employeeId = req.userId as string;
        const employeeDetails = req.user as any;
        const { latitude, longitude, lateCheckoutReason } = req.body;


        if (!latitude || !longitude) {
            res.status(200).json({
                message: "Please Provide Latitude and Longitude"
            })
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        const attendanceRecord = await AttendanceRecord.findOne({
            where: {
                employeeId,
                date: today
            }
        });

        if (!attendanceRecord) {
            res.status(400).json({ message: 'No check-in record found for today' });
            return;
        }

        if (attendanceRecord.checkOutTime) {
            res.status(400).json({ message: 'Already checked out today' });
            return;
        }

        let isWithinFence = false;
        if (latitude && longitude) {
            isWithinFence = await isLocationWithinGeoFence({
                latitude,
                longitude,
            });
        }

        await attendanceRecord.update({
            checkOutTime: new Date().toTimeString().split(' ')[0],
            locationLatitude: latitude || attendanceRecord.locationLatitude,
            locationLongitude: longitude || attendanceRecord.locationLongitude,
            locationTimestamp: new Date().toISOString(),
            isWithinFence: isWithinFence !== undefined ? isWithinFence : attendanceRecord.isWithinFence,
            lateCheckoutReason
        });

        await createNotification({
            userId: employeeId,
            title: 'Check-out Successful',
            message: `You have checked out at ${new Date().toTimeString().split(' ')[0]}.`,
            type: 'system',
            referenceId: attendanceRecord.id
        });

        const admins = await User.findAll({ where: { role: 'admin' } });
        for (const admin of admins) {
            await createNotification({
                userId: admin.id,
                title: 'Employee Check-out',
                message: `Employee ${employeeDetails.fullName ? employeeDetails.fullName : employeeId} has checked out at ${new Date().toTimeString().split(' ')[0]}.`,
                type: 'system',
                referenceId: attendanceRecord.id
            });
        }

        res.status(200).json({
            message: 'Check-out successful',
            attendance: attendanceRecord
        });
    } catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({ message: 'Server error during check-out' });
    }
};

export const getTodayAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
        const employeeId = req.userId as string;
        const today = new Date().toISOString().split('T')[0];

        const attendance = await AttendanceRecord.findOne({
            where: {
                employeeId,
                date: today
            }
        });

        res.status(200).json({
            message: 'Today\'s attendance retrieved',
            attendance: attendance || null
        });
    } catch (error) {
        console.error('Error fetching today\'s attendance:', error);
        res.status(500).json({ message: 'Server error while fetching attendance' });
    }
};

export const getMyAttendanceHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const employeeId = req.userId as string;
        const attendance = await AttendanceRecord.findAll({
            where: { employeeId },
            order: [['date', 'DESC']]
        });

        res.status(200).json({
            message: 'Attendance history retrieved',
            attendance
        });
    } catch (error) {
        console.error('Error fetching attendance history:', error);
        res.status(500).json({ message: 'Server error while fetching attendance history' });
    }
};

export const getEmployeeAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(400).json({ message: 'You are not authorized to access this route' });
            return;
        }
        const { employeeId } = req.params;
        const { startDate, endDate } = req.query;

        if (!employeeId) {
            res.status(400).json({ message: 'Employee ID is required' });
            return;
        }
        let whereClause: any = { employeeId };

        if (startDate && endDate) {
            whereClause.date = {
                [Op.between]: [startDate, endDate]
            };
        } else if (startDate) {
            whereClause.date = {
                [Op.gte]: startDate
            };
        } else if (endDate) {
            whereClause.date = {
                [Op.lte]: endDate
            };
        }

        const attendance = await AttendanceRecord.findAll({
            where: whereClause,
            order: [['date', 'DESC']]
        });

        res.status(200).json({
            message: 'Employee attendance retrieved',
            attendance
        });
    } catch (error) {
        console.error('Error fetching employee attendance:', error);
        res.status(500).json({ message: 'Server error while fetching employee attendance' });
    }
};

export const getAllEmployeeAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(400).json({ message: 'You are not authorized to access this route' });
            return;
        }
        const attendance = await AttendanceRecord.findAll({
            include: [
                {
                    model: User,
                    as: 'employee',
                    attributes: ['id', 'fullName', 'department', 'designation'],
                    required: true
                }
            ],
            order: [['date', 'DESC']]
        });

        res.status(200).json({
            message: 'All Employee attendance retrieved',
            attendance
        });
    } catch (error) {
        console.error('Error fetching All employee attendance:', error);
        res.status(500).json({ message: 'Server error while fetching employee attendance' });
    }
};

export const getAttendanceByDate = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(400).json({ message: 'You are not authorized to access this route' });
            return;
        }

        const { date } = req.params;

        const attendance = await AttendanceRecord.findAll({
            where: {
                date: date || new Date().toISOString().split('T')[0]
            },
            include: [
                {
                    model: User,
                    as: 'employee',
                    attributes: ['id', 'fullName', 'department', 'designation']
                }
            ]
        });

        res.status(200).json({
            message: 'Attendance records retrieved',
            attendance
        });
    } catch (error) {
        console.error('Error fetching attendance by date:', error);
        res.status(500).json({ message: 'Server error while fetching attendance' });
    }
};

export const manuallyAddEditAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(400).json({ message: 'You are not authorized to access this route' });
            return;
        }
        const { employeeId, date, checkInTime, checkOutTime } = req.body;

        const existingRecord = await AttendanceRecord.findOne({
            where: { employeeId, date }
        });

        if (existingRecord) {
            await existingRecord.update({
                checkInTime: checkInTime || existingRecord.checkInTime,
                checkOutTime: checkOutTime !== undefined ? checkOutTime : existingRecord.checkOutTime,
                manuallyEdited: true
            });

            await createNotification({
                userId: employeeId,
                title: 'Attendance Record Updated',
                message: `Your attendance record for ${date} has been updated by an administrator.`,
                type: 'system',
                referenceId: existingRecord.id
            });
            res.status(200).json({
                message: 'Attendance record updated manually',
                attendance: existingRecord
            });
        } else {
            const newRecord = await AttendanceRecord.create({
                id: uuidv4(),
                employeeId,
                date,
                checkInTime,
                checkOutTime,
                manuallyAdded: true
            });

            await createNotification({
                userId: employeeId,
                title: 'Attendance Record Added',
                message: `A new attendance record for ${date} has been added by an administrator.`,
                type: 'system',
                referenceId: newRecord.id
            });

            res.status(201).json({
                message: 'Attendance record added manually',
                attendance: newRecord
            });
        }
    } catch (error) {
        console.error('Error manually managing attendance:', error);
        res.status(500).json({ message: 'Server error while managing attendance' });
    }
};

export const deleteAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(400).json({ message: 'You are not authorized to access this route' });
            return;
        }
        const { id } = req.params;

        const record = await AttendanceRecord.findByPk(id);

        if (!record) {
            res.status(404).json({ message: 'Attendance record not found' });
            return;
        }

        await record.destroy();

        res.status(200).json({ message: 'Attendance record deleted successfully' });
    } catch (error) {
        console.error('Error deleting attendance record:', error);
        res.status(500).json({ message: 'Server error while deleting attendance record' });
    }
};