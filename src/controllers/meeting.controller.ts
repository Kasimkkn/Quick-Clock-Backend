import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Project } from '../models/project.model';
import Meeting from '../models/meeting.model';
import { createNotification } from '../services/notification.services';

export const getMeetings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId, startDate, endDate, userId } = req.query;

        // Build the where clause based on query parameters
        const whereClause: any = {};

        if (projectId) {
            whereClause.projectId = projectId;
        }

        if (startDate && endDate) {
            whereClause.startTime = {
                [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
            };
        } else if (startDate) {
            whereClause.startTime = {
                [Op.gte]: new Date(startDate as string)
            };
        } else if (endDate) {
            whereClause.startTime = {
                [Op.lte]: new Date(endDate as string)
            };
        }

        if (userId) {
            // Find meetings where the user is an attendee or organizer
            whereClause[Op.or] = [
                { organizer: userId },
                { attendees: { [Op.contains]: [userId] } }
            ];
        }

        const meetings = await Meeting.findAll({
            where: whereClause,
            include: [
                {
                    model: Project,
                    as: 'project',
                    attributes: ['id', 'name'],
                    required: false
                }
            ],
            order: [['startTime', 'ASC']]
        });

        res.status(200).json(meetings);
    } catch (error) {
        console.error('Error fetching meetings:', error);
        res.status(500).json({ error: 'Failed to fetch meetings' });
    }
};

export const createMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            title,
            description,
            startTime,
            endTime,
            location,
            isVirtual,
            meetingLink,
            isRecurring,
            recurringPattern,
            attendees,
            projectId
        } = req.body;

        const user = req.user;

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const userId = user.id;

        if (!title || !startTime || !endTime) {
            res.status(400).json({ error: 'Title, start time, and end time are required' });
            return;
        }

        // Validate meeting times
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (end <= start) {
            res.status(400).json({ error: 'End time must be after start time' });
            return;
        }

        // Check if virtual meeting has a link
        if (isVirtual && !meetingLink) {
            res.status(400).json({ error: 'Virtual meetings require a meeting link' });
            return;
        }

        // Check if recurring meeting has a pattern
        if (isRecurring && !recurringPattern) {
            res.status(400).json({ error: 'Recurring meetings require a pattern' });
            return;
        }

        const meeting = await Meeting.create({
            title,
            description,
            startTime: start,
            endTime: end,
            location,
            isVirtual,
            meetingLink,
            isRecurring,
            recurringPattern,
            organizer: userId,
            attendees: attendees || [],
            projectId
        });

        // Notify all attendees about the new meeting
        if (attendees && attendees.length > 0) {
            attendees.forEach(async (attendeeId: string) => {
                if (attendeeId !== userId) { // Don't notify the organizer
                    await createNotification({
                        userId: attendeeId,
                        title: 'New Meeting Invitation',
                        message: `You have been invited to the meeting "${title}" scheduled for ${start.toLocaleString()}.`,
                        type: 'meeting',
                        referenceId: meeting.id
                    });
                }
            });
        }

        // Fetch with project data
        const meetingWithProject = await Meeting.findByPk(meeting.id, {
            include: [
                {
                    model: Project,
                    as: 'project',
                    attributes: ['id', 'name'],
                    required: false
                }
            ]
        });

        res.status(201).json(meetingWithProject);
    } catch (error) {
        console.error('Error creating meeting:', error);
        res.status(500).json({ error: 'Failed to create meeting' });
    }
};

export const updateMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
        const { meetingId } = req.params;
        const user = req.user;

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const userId = user.id;

        // Check if meeting exists
        const meeting = await Meeting.findByPk(meetingId);

        if (!meeting) {
            res.status(404).json({ error: 'Meeting not found' });
            return;
        }

        // Check if user is authorized to update (only organizer can update)
        if (meeting.organizer !== userId) {
            res.status(403).json({ error: 'You are not authorized to update this meeting' });
            return;
        }

        const {
            title,
            description,
            startTime,
            endTime,
            location,
            isVirtual,
            meetingLink,
            isRecurring,
            recurringPattern,
            attendees,
            projectId
        } = req.body;

        // Validate meeting times if provided
        if (startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);

            if (end <= start) {
                res.status(400).json({ error: 'End time must be after start time' });
                return;
            }
        } else if (startTime || endTime) {
            res.status(400).json({ error: 'Both start time and end time must be provided together' });
            return;
        }

        // Store original values for comparison
        const originalAttendees = meeting.attendees || [];
        const originalStartTime = meeting.startTime;
        const originalTitle = meeting.title;

        // Update meeting
        await meeting.update({
            title: title || meeting.title,
            description: description !== undefined ? description : meeting.description,
            startTime: startTime ? new Date(startTime) : meeting.startTime,
            endTime: endTime ? new Date(endTime) : meeting.endTime,
            location: location !== undefined ? location : meeting.location,
            isVirtual: isVirtual !== undefined ? isVirtual : meeting.isVirtual,
            meetingLink: meetingLink !== undefined ? meetingLink : meeting.meetingLink,
            isRecurring: isRecurring !== undefined ? isRecurring : meeting.isRecurring,
            recurringPattern: recurringPattern !== undefined ? recurringPattern : meeting.recurringPattern,
            attendees: attendees || meeting.attendees,
            projectId: projectId !== undefined ? projectId : meeting.projectId
        });

        // Notify attendees about meeting updates
        const currentAttendees = attendees || originalAttendees;
        const hasTimeChanged = startTime && new Date(startTime).getTime() !== originalStartTime.getTime();
        const hasTitleChanged = title && title !== originalTitle;

        if (hasTimeChanged || hasTitleChanged || attendees) {
            // Find new attendees
            const newAttendees = attendees ? attendees.filter((id: string) => !originalAttendees.includes(id)) : [];

            // Notify new attendees
            newAttendees.forEach(async (attendeeId: string) => {
                if (attendeeId !== userId) {
                    await createNotification({
                        userId: attendeeId.toString(),
                        title: 'Meeting Invitation',
                        message: `You have been added to the meeting "${meeting.title}" scheduled for ${meeting.startTime.toLocaleString()}.`,
                        type: 'meeting',
                        referenceId: meeting.id
                    });
                }
            });

            // Notify existing attendees about updates (if time or title changed)
            if (hasTimeChanged || hasTitleChanged) {
                currentAttendees.forEach(async (attendeeId: string) => {
                    if (attendeeId !== userId && originalAttendees.includes(attendeeId)) {
                        let updateMessage = `The meeting "${meeting.title}" has been updated.`;
                        if (hasTimeChanged) {
                            updateMessage += ` New time: ${meeting.startTime.toLocaleString()}.`;
                        }

                        await createNotification({
                            userId: attendeeId.toString(),
                            title: 'Meeting Updated',
                            message: updateMessage,
                            type: 'meeting',
                            referenceId: meeting.id
                        });
                    }
                });
            }
        }

        // Fetch updated meeting with project
        const updatedMeeting = await Meeting.findByPk(meetingId, {
            include: [
                {
                    model: Project,
                    as: 'project',
                    attributes: ['id', 'name'],
                    required: false
                }
            ]
        });

        res.status(200).json(updatedMeeting);
    } catch (error) {
        console.error('Error updating meeting:', error);
        res.status(500).json({ error: 'Failed to update meeting' });
    }
};

export const deleteMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
        const { meetingId } = req.params;
        const user = req.user;

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const userId = user.id;

        // Check if meeting exists
        const meeting = await Meeting.findByPk(meetingId);

        if (!meeting) {
            res.status(404).json({ error: 'Meeting not found' });
            return;
        }

        // Check if user is authorized to delete (only organizer can delete)
        if (meeting.organizer !== userId) {
            res.status(403).json({ error: 'You are not authorized to delete this meeting' });
            return;
        }

        // Delete the meeting
        await meeting.destroy();

        res.status(200).json({ message: 'Meeting deleted successfully' });
    } catch (error) {
        console.error('Error deleting meeting:', error);
        res.status(500).json({ error: 'Failed to delete meeting' });
    }
};
export const meetingController = {
    getMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting
};

