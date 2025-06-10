import { User } from './user.model';
import { AttendanceRecord } from './attendance.model';
import { Leave } from './leave.model';
import { Holiday } from './holiday.model';
import { GeoFence } from './geofence.model';
import { ManualAttendanceRequest } from './manualRequest.model';
import { Notification } from './notification.model';
import { Project } from './project.model';
import { Task } from './task.model';
import Meeting from './meeting.model';
import ThreadComment from './threadComment.model';
import DiscussionThread from './discussionThread.model';
import DocumentAttachment from './documentAttachment.model';
import ProjectUpdate from './projectUpdates.model';

export const initializeAssociations = (): void => {
    // User - AttendanceRecord (one-to-many)
    User.hasMany(AttendanceRecord, { foreignKey: 'employeeId', as: 'attendanceRecords' });
    AttendanceRecord.belongsTo(User, { foreignKey: 'employeeId', as: 'employee' });

    // User - Leave (one-to-many)
    User.hasMany(Leave, { foreignKey: 'employeeId', as: 'leaves' });
    Leave.belongsTo(User, { foreignKey: 'employeeId', as: 'employee' });

    // User - ManualAttendanceRequest (one-to-many)
    User.hasMany(ManualAttendanceRequest, { foreignKey: 'employeeId', as: 'manualRequests' });
    ManualAttendanceRequest.belongsTo(User, { foreignKey: 'employeeId', as: 'employee' });

    // Leave - User (for approver)
    Leave.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver', constraints: false });

    Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });


    // Define associations
    Project.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
    Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks' });


    Task.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
    Task.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
    Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

    // DiscussionThread - Project
    DiscussionThread.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
    Project.hasMany(DiscussionThread, { foreignKey: 'projectId', as: 'threads' });

    // DiscussionThread - User
    DiscussionThread.belongsTo(User, { foreignKey: 'createdBy', as: 'user' });
    User.hasMany(DiscussionThread, { foreignKey: 'createdBy', as: 'threads' });

    // ThreadComment - Thread
    ThreadComment.belongsTo(DiscussionThread, { foreignKey: 'threadId', as: 'thread' });
    DiscussionThread.hasMany(ThreadComment, { foreignKey: 'threadId', as: 'comments' });

    // ThreadComment - User
    ThreadComment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    User.hasMany(ThreadComment, { foreignKey: 'userId', as: 'comments' });

    // Meeting - Project (optional)
    Meeting.belongsTo(Project, { foreignKey: 'projectId', as: 'project', constraints: false });
    Project.hasMany(Meeting, { foreignKey: 'projectId', as: 'meetings' });

    // Meeting - User (organizer)
    Meeting.belongsTo(User, { foreignKey: 'organizer', as: 'organizerUser' });
    User.hasMany(Meeting, { foreignKey: 'organizer', as: 'organizedMeetings' });

    // DocumentAttachment - Project (optional)
    DocumentAttachment.belongsTo(Project, { foreignKey: 'projectId', as: 'project', constraints: false });
    Project.hasMany(DocumentAttachment, { foreignKey: 'projectId', as: 'documents' });

    // DocumentAttachment - User (uploader)
    DocumentAttachment.belongsTo(User, { foreignKey: 'uploadedBy', as: 'user' });
    User.hasMany(DocumentAttachment, { foreignKey: 'uploadedBy', as: 'uploadedDocuments' });

    ProjectUpdate.belongsTo(User, {
        foreignKey: 'userId',
        as: 'user'
    });

    ProjectUpdate.belongsTo(Project, {
        foreignKey: 'projectId',
        as: 'project'
    });
};

export {
    User,
    AttendanceRecord,
    Leave,
    Holiday,
    GeoFence,
    ManualAttendanceRequest
};