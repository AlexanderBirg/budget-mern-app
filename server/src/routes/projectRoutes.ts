import { Router } from 'express';
import { calculateProject, createProject, getProjectWorkspace, getProjects } from '../controllers/projectController.js';
import { getDefaultMatrix, getEmployees, getScenarios, getTasks } from '../controllers/dictionaryController.js';

const router = Router();

// Маршруты сгруппированы вокруг проекта, потому что расчет всегда выполняется для конкретного проекта.
router.get('/projects', getProjects);
router.post('/projects', createProject);
router.get('/projects/:projectId/workspace', getProjectWorkspace);
router.post('/projects/:projectId/calculate', calculateProject);
router.get('/projects/:projectId/tasks', getTasks);
router.get('/projects/:projectId/scenarios', getScenarios);
router.get('/employees', getEmployees);
router.get('/risk-matrix/default', getDefaultMatrix);

export default router;
