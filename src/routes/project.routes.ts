import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all projects
router.get('/', projectController.getAllProjects);

// Get project by ID
router.get('/:id', projectController.getProjectById);

// Create new project (Admin only)
router.post('/', projectController.createProject);

// Update project (Admin only)
router.put('/:id', projectController.updateProject);

// Delete project (Admin only)
router.delete('/:id', projectController.deleteProject);


export default router;