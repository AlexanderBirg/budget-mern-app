import type { Request, Response } from 'express';
import { TaskModel } from '../models/TaskModel.js';
import { EmployeeModel } from '../models/EmployeeModel.js';
import { RiskMatrixModel } from '../models/RiskMatrixModel.js';
import { ScenarioModel } from '../models/ScenarioModel.js';
import { mapEmployee, mapMatrixCells, mapScenario, mapTask } from '../utils/mappers.js';

// Эти контроллеры нужны для отдельных экранов интерфейса: задачи, исполнители, матрица, сценарии.
export async function getTasks(req: Request, res: Response): Promise<void> {
  const tasks = await TaskModel.find({ projectId: req.params.projectId }).sort({ order: 1 }).lean();
  res.json(tasks.map(mapTask));
}

export async function getEmployees(_req: Request, res: Response): Promise<void> {
  const employees = await EmployeeModel.find().sort({ role: 1, grade: 1 }).lean();
  res.json(employees.map(mapEmployee));
}

export async function getDefaultMatrix(_req: Request, res: Response): Promise<void> {
  const matrix = await RiskMatrixModel.findOne({ isDefault: true }).lean();
  res.json(matrix ? { id: matrix._id, name: matrix.name, version: matrix.version, cells: mapMatrixCells(matrix.cells) } : null);
}

export async function getScenarios(req: Request, res: Response): Promise<void> {
  const scenarios = await ScenarioModel.find({ projectId: req.params.projectId }).lean();
  res.json(scenarios.map(mapScenario));
}
