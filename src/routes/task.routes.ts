import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all tasks
router.get('/', taskController.getAllTasks);

// Get my tasks (tasks assigned to current user)
router.get('/my-tasks', taskController.getMyTasks);

// Get task by ID
router.get('/:id', taskController.getTaskById);

// Create new task (Admin only)
router.post('/', taskController.createTask);

// Update task status (Both admin and assigned user)
router.patch('/:id/status', taskController.updateTaskStatus);

// Update task (Admin only)
router.put('/:id', taskController.updateTask);

// Delete task (Admin only)
router.delete('/:id', taskController.deleteTask);

// task update request by user 
router.put('/request-update/:id', taskController.requestTaskUpdate);

export default router;