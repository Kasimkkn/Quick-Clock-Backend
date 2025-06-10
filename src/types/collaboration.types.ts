export interface DiscussionThreadAttributes {
    id: string;
    projectId: string;
    title: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    lastActivity: Date;
    commentCount: number;
}

export interface DiscussionThreadCreationAttributes {
    projectId: string;
    title: string;
    createdBy: string;
}

export interface ThreadCommentAttributes {
    id: string;
    threadId: string;
    userId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ThreadCommentCreationAttributes {
    threadId: string;
    userId: string;
    content: string;
}

export interface MeetingAttributes {
    id: string;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    isVirtual: boolean;
    meetingLink?: string;
    isRecurring: boolean;
    recurringPattern?: string;
    organizer: string;
    attendees: string[];
    projectId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface MeetingCreationAttributes {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    isVirtual: boolean;
    meetingLink?: string;
    isRecurring: boolean;
    recurringPattern?: string;
    organizer: string;
    attendees: string[];
    projectId?: string;
}

export interface DocumentAttachmentAttributes {
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    url: string;
    uploadedBy: string;
    projectId?: string;
    permissions: DocumentPermission[];
    createdAt: Date;
    updatedAt: Date;
}

export interface DocumentAttachmentCreationAttributes {
    fileName: string;
    fileSize: number;
    fileType: string;
    url: string;
    uploadedBy: string;
    projectId?: string;
    permissions: DocumentPermission[];
}

export interface DocumentPermission {
    userId: string;
    access: "view" | "edit" | "delete";
}
