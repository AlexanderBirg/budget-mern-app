import type { Request, Response } from 'express';
import { EmployeeModel } from '../models/EmployeeModel.js';
import { ProjectModel } from '../models/ProjectModel.js';
import { RiskMatrixModel } from '../models/RiskMatrixModel.js';
import { ScenarioModel } from '../models/ScenarioModel.js';
import { TaskModel } from '../models/TaskModel.js';
import { mapEmployee, mapMatrixCells, mapProject, mapScenario, mapTask } from '../utils/mappers.js';

// Эти контроллеры отвечают за редактирование данных, которые затем используются расчетным ядром.
// В MVP нет авторизации, поэтому все операции выполняются напрямую.

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  const project = await ProjectModel.findByIdAndUpdate(req.params.projectId, req.body, { new: true, runValidators: true }).lean();

  if (!project) {
    res.status(404).json({ message: 'Проект не найден' });
    return;
  }

  res.json(mapProject(project));
}

export async function createTask(req: Request, res: Response): Promise<void> {
  const projectId = req.params.projectId;
  const id = req.body.id || makeId('task');

  const task = await TaskModel.create({
    _id: id,
    projectId,
    name: req.body.name || 'Новая задача',
    stage: req.body.stage || 'analytics',
    baseHours: Number(req.body.baseHours || 1),
    complexityLevel: req.body.complexityLevel || 'L1',
    isCritical: Boolean(req.body.isCritical),
    order: Number(req.body.order || 1),
    dependsOnTaskIds: Array.isArray(req.body.dependsOnTaskIds) ? req.body.dependsOnTaskIds : [],
  });

  res.status(201).json(mapTask(task.toObject()));
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  const task = await TaskModel.findByIdAndUpdate(req.params.taskId, req.body, { new: true, runValidators: true }).lean();

  if (!task) {
    res.status(404).json({ message: 'Задача не найдена' });
    return;
  }

  res.json(mapTask(task));
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  const task = await TaskModel.findByIdAndDelete(req.params.taskId).lean();

  if (!task) {
    res.status(404).json({ message: 'Задача не найдена' });
    return;
  }

  // Удаляем назначения на удаленную задачу, чтобы сценарии не ссылались на несуществующие данные.
  await ScenarioModel.updateMany({}, { $pull: { assignments: { taskId: req.params.taskId } } });
  res.json({ ok: true });
}

export async function replaceProjectTasks(req: Request, res: Response): Promise<void> {
  const projectId = req.params.projectId;
  const tasks = Array.isArray(req.body.tasks) ? req.body.tasks : [];

  // Групповое сохранение задач: пользователь редактирует таблицу на клиенте,
  // а сервер заменяет весь набор задач проекта одной операцией.
  await TaskModel.deleteMany({ projectId });

  const normalizedTasks = tasks.map((task: any, index: number) => ({
    _id: task.id || makeId('task'),
    projectId,
    name: task.name || 'Новая задача',
    stage: task.stage || 'analytics',
    baseHours: Number(task.baseHours || 1),
    complexityLevel: task.complexityLevel || 'L1',
    isCritical: Boolean(task.isCritical),
    order: Number(task.order || index + 1),
    dependsOnTaskIds: Array.isArray(task.dependsOnTaskIds) ? task.dependsOnTaskIds.filter((id: string) => id !== task.id) : [],
  }));

  const actualTaskIds = normalizedTasks.map((task: any) => task._id);

  // Оставляем только зависимости на задачи, которые реально сохранились в проекте.
  for (const task of normalizedTasks) {
    task.dependsOnTaskIds = task.dependsOnTaskIds.filter((id: string) => actualTaskIds.includes(id));
  }

  const createdTasks = normalizedTasks.length > 0
    ? await TaskModel.insertMany(normalizedTasks)
    : [];

  // Если пользователь удалил задачу из таблицы, удаляем и назначения на нее в сценариях проекта.
  await ScenarioModel.updateMany(
    { projectId },
    { $pull: { assignments: { taskId: { $nin: actualTaskIds } } } }
  );

  res.json(createdTasks.map((task: any) => mapTask(task.toObject())));
}

export async function createEmployee(req: Request, res: Response): Promise<void> {
  const id = req.body.id || makeId('emp');

  const employee = await EmployeeModel.create({
    _id: id,
    name: req.body.name || 'Новый исполнитель',
    role: req.body.role || 'general',
    grade: req.body.grade || 'middle',
    hourRate: Number(req.body.hourRate || 1000),
    availability: Number(req.body.availability || 1),
  });

  res.status(201).json(mapEmployee(employee.toObject()));
}

export async function updateEmployee(req: Request, res: Response): Promise<void> {
  const employee = await EmployeeModel.findByIdAndUpdate(req.params.employeeId, req.body, { new: true, runValidators: true }).lean();

  if (!employee) {
    res.status(404).json({ message: 'Исполнитель не найден' });
    return;
  }

  res.json(mapEmployee(employee));
}

export async function deleteEmployee(req: Request, res: Response): Promise<void> {
  const employee = await EmployeeModel.findByIdAndDelete(req.params.employeeId).lean();

  if (!employee) {
    res.status(404).json({ message: 'Исполнитель не найден' });
    return;
  }

  // Удаляем назначения на удаленного исполнителя.
  await ScenarioModel.updateMany({}, { $pull: { assignments: { employeeId: req.params.employeeId } } });
  res.json({ ok: true });
}

export async function replaceEmployees(req: Request, res: Response): Promise<void> {
  const employees = Array.isArray(req.body.employees) ? req.body.employees : [];

  // Групповое сохранение справочника исполнителей.
  // Исполнители являются общими для системы, поэтому заменяем весь справочник целиком.
  await EmployeeModel.deleteMany({});

  const normalizedEmployees = employees.map((employee: any) => ({
    _id: employee.id || makeId('emp'),
    name: employee.name || 'Новый исполнитель',
    role: employee.role || 'general',
    grade: employee.grade || 'middle',
    hourRate: Number(employee.hourRate || 1000),
    availability: Number(employee.availability || 1),
  }));

  const createdEmployees = normalizedEmployees.length > 0
    ? await EmployeeModel.insertMany(normalizedEmployees)
    : [];

  const actualEmployeeIds = normalizedEmployees.map((employee: any) => employee._id);

  // Если исполнитель удален из справочника, удаляем назначения на него из сценариев.
  await ScenarioModel.updateMany(
    {},
    { $pull: { assignments: { employeeId: { $nin: actualEmployeeIds } } } }
  );

  res.json(createdEmployees.map((employee: any) => mapEmployee(employee.toObject())));
}

export async function updateDefaultMatrix(req: Request, res: Response): Promise<void> {
  const matrix = await RiskMatrixModel.findOneAndUpdate(
    { isDefault: true },
    { cells: req.body.cells || [] },
    { new: true, runValidators: true }
  ).lean();

  if (!matrix) {
    res.status(404).json({ message: 'Матрица по умолчанию не найдена' });
    return;
  }

  res.json(mapMatrixCells(matrix.cells));
}

export async function createScenario(req: Request, res: Response): Promise<void> {
  const projectId = req.params.projectId;
  const id = req.body.id || makeId('scenario');

  const scenario = await ScenarioModel.create({
    _id: id,
    projectId,
    name: req.body.name || 'Новый сценарий',
    description: req.body.description || '',
    teamFitCoefficient: Number(req.body.teamFitCoefficient || 0.8),
    deltaMode: req.body.deltaMode || 'criticalOnly',
    assignments: req.body.assignments || [],
  });

  res.status(201).json(mapScenario(scenario.toObject()));
}

export async function updateScenario(req: Request, res: Response): Promise<void> {
  const scenario = await ScenarioModel.findByIdAndUpdate(req.params.scenarioId, req.body, { new: true, runValidators: true }).lean();

  if (!scenario) {
    res.status(404).json({ message: 'Сценарий не найден' });
    return;
  }

  res.json(mapScenario(scenario));
}

export async function deleteScenario(req: Request, res: Response): Promise<void> {
  const scenario = await ScenarioModel.findByIdAndDelete(req.params.scenarioId).lean();

  if (!scenario) {
    res.status(404).json({ message: 'Сценарий не найден' });
    return;
  }

  res.json({ ok: true });
}
