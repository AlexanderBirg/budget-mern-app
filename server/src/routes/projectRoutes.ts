import { Router } from 'express';
import { calculateProject, createProject, getProjectWorkspace, getProjects } from '../controllers/projectController.js';
import { createEmployee, createScenario, createTask, deleteEmployee, deleteScenario, deleteTask, updateDefaultMatrix, updateEmployee, updateProject, updateScenario, updateTask } from '../controllers/editController.js';
import { getDefaultMatrix, getEmployees, getScenarios, getTasks } from '../controllers/dictionaryController.js';

const router = Router();

// Маршруты сгруппированы вокруг проекта, потому что расчет всегда выполняется для конкретного проекта.
router.get('/projects', getProjects);
router.post('/projects', createProject);
router.put('/projects/:projectId', updateProject);
router.get('/projects/:projectId/workspace', getProjectWorkspace);
router.post('/projects/:projectId/calculate', calculateProject);
router.get('/projects/:projectId/tasks', getTasks);
router.post('/projects/:projectId/tasks', createTask);
router.patch('/tasks/:taskId', updateTask);
router.delete('/tasks/:taskId', deleteTask);
router.get('/projects/:projectId/scenarios', getScenarios);
router.post('/projects/:projectId/scenarios', createScenario);
router.patch('/scenarios/:scenarioId', updateScenario);
router.delete('/scenarios/:scenarioId', deleteScenario);
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.patch('/employees/:employeeId', updateEmployee);
router.delete('/employees/:employeeId', deleteEmployee);
router.get('/risk-matrix/default', getDefaultMatrix);
router.put('/risk-matrix/default', updateDefaultMatrix);

export default router;
