import { Router } from 'express';
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskComments,
  addTaskComment,
} from '../controllers/taskController.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { createTaskSchema, updateTaskSchema } from '../validators/schemas.js';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('tasks:read'), listTasks);
router.post('/', requirePermission('tasks:create'), validateBody(createTaskSchema), createTask);
router.patch('/:taskId', requirePermission('tasks:update'), validateBody(updateTaskSchema), updateTask);
router.delete('/:taskId', requirePermission('tasks:delete'), deleteTask);
router.get('/:taskId/comments', requirePermission('tasks:read'), getTaskComments);
router.post('/:taskId/comments', requirePermission('tasks:update'), addTaskComment);

export default router;
