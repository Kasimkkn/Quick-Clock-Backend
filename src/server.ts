import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/config';
import { initializeDatabase } from './config/db';
import routes from './routes/index';
import { User, initializeAssociations, Leave, AttendanceRecord } from './models';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { createNotification } from './services/notification.services';
import cron from 'node-cron'

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        message: 'QuickClock API is running',
        timestamp: new Date(),
        environment: config.server.nodeEnv
    });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: config.server.nodeEnv === 'development' ? err.message : undefined
    });
});

app.use((req: Request, res: Response) => {
    res.status(404).json({
        status: 'error',
        message: 'Resource not found'
    });
});

const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
};

const getPreviousWorkingDay = (): Date => {
    const today = new Date();
    let previousDay = new Date(today);

    do {
        previousDay.setDate(previousDay.getDate() - 1);
    } while (isWeekend(previousDay));

    return previousDay;
};

const autoApplyLeaveForAbsentees = async (employeeId: string, date: Date, employeeDetails: any) => {
    try {
        const dateString = date.toISOString().split('T')[0];

        const existingLeave = await Leave.findOne({
            where: {
                employeeId,
                startDate: { [Op.lte]: dateString },
                endDate: { [Op.gte]: dateString }
            }
        });

        if (existingLeave) {
            console.log(`Leave already exists for employee ${employeeId} on ${dateString}`);
            return;
        }

        const leave = await Leave.create({
            id: uuidv4(),
            employeeId,
            startDate: dateString,
            endDate: dateString,
            type: 'casual',
            reason: 'Auto-deducted for absence',
            status: 'pending'
        });

        await createNotification({
            userId: employeeId,
            title: 'Auto Leave Applied',
            message: `Leave has been automatically applied for ${date.toLocaleDateString()} due to absence (no check-in/check-out recorded).`,
            type: 'system',
            referenceId: leave.id
        });

        const admins = await User.findAll({ where: { role: 'admin' } });
        for (const admin of admins) {
            await createNotification({
                userId: admin.id,
                title: 'Auto Leave Applied',
                message: `Auto leave applied for employee ${employeeDetails.fullName || employeeId} on ${date.toLocaleDateString()} due to absence.`,
                type: 'system',
                referenceId: leave.id
            });
        }

        console.log(`Auto leave applied for employee ${employeeId} on ${dateString}`);
    } catch (error) {
        console.error(`Error applying auto leave for employee ${employeeId}:`, error);
    }
};

const checkAttendanceAndApplyLeave = async () => {
    try {
        console.log('Starting attendance check...');

        const previousWorkingDay = getPreviousWorkingDay();
        const dateString = previousWorkingDay.toISOString().split('T')[0];

        console.log(`Checking attendance for: ${dateString}`);

        const employees = await User.findAll({
            where: {
                role: { [Op.ne]: 'admin' }
            }
        });

        console.log(`Found ${employees.length} employees to check`);

        for (const employee of employees) {
            const attendance = await AttendanceRecord.findOne({
                where: {
                    employeeId: employee.id,
                    date: dateString
                }
            });

            if (!attendance) {
                console.log(`No attendance found for employee ${employee.fullName} (${employee.id}) on ${dateString}`);
                await autoApplyLeaveForAbsentees(employee.id, previousWorkingDay, employee);
            } else {
                if (!attendance.checkInTime || !attendance.checkOutTime) {
                    console.log(`Incomplete attendance for employee ${employee.fullName} (${employee.id}) on ${dateString} - Missing ${!attendance.checkInTime ? 'check-in' : 'check-out'}`);
                    await autoApplyLeaveForAbsentees(employee.id, previousWorkingDay, employee);
                } else {
                    console.log(`Complete attendance found for employee ${employee.fullName} (${employee.id}) on ${dateString}`);
                }
            }
        }
    } catch (error) {
        console.error('Error during attendance check:', error);
    }
};

const PORT = config.server.port;

const startServer = async () => {
    try {
        await initializeDatabase();

        initializeAssociations();
        const user = await User.findOne({ where: { role: 'admin' } });

        if (!user) {
            await User.create({
                email: 'admin@gmail.com',
                password: 'admin123',
                department: 'admin',
                designation: 'owner',
                fullName: 'admin of quickclock',
                mobile: '1234567890',
                role: 'admin',
                birthday: '2000-01-01',
                createdAt: new Date(),
                updatedAt: new Date(),
                id: uuidv4(),
                photoUrl: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlcnN8ZW58MHx8MHx8fDA%3D'
            });
        } else {
            console.log('Admin user already exists');
        }

        await checkAttendanceAndApplyLeave();

        cron.schedule('0 9 * * 1-5', checkAttendanceAndApplyLeave); // Run at 9 AM on weekdays

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${config.server.nodeEnv}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();