import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { documentController, upload } from '../controllers/document.controller';
import { discussionThreadController } from '../controllers/discussionThread.controller';
import { meetingController } from '../controllers/meeting.controller';

const router = Router();

// Thread routes
router.get('/threads', authenticate, discussionThreadController.getThreads);
router.post('/threads', authenticate, discussionThreadController.createThread);
router.get('/threads/:threadId/comments', authenticate, discussionThreadController.getComments);
router.post('/threads/:threadId/comments', authenticate, discussionThreadController.addComment);

// Meeting routes
router.get('/meetings', authenticate, meetingController.getMeetings);
router.post('/meetings', authenticate, meetingController.createMeeting);
router.put('/meetings/:meetingId', authenticate, meetingController.updateMeeting);
router.delete('/meetings/:meetingId', authenticate, meetingController.deleteMeeting);

// Document routes
router.get('/documents', authenticate, documentController.getDocuments);
router.post('/documents/upload', authenticate, upload.single('file'), documentController.uploadDocument);
router.delete('/documents/:documentId', authenticate, documentController.deleteDocument);
router.put('/documents/:documentId/permissions', authenticate, documentController.updateDocumentPermissions);

export default router;