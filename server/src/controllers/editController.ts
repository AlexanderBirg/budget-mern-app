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
