import { Router } from 'express';
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { createProjectSchema, updateProjectSchema } from '../validators/schemas.js';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('projects:read'), listProjects);
router.post('/', requirePermission('projects:create'), validateBody(createProjectSchema), createProject);
router.get('/:projectId', requirePermission('projects:read'), getProject);
router.patch('/:projectId', requirePermission('projects:update'), validateBody(updateProjectSchema), updateProject);
router.delete('/:projectId', requirePermission('projects:delete'), deleteProject);

export default router;
