import type { Request, Response } from 'express';
import { ProjectModel } from '../models/ProjectModel.js';
import { TaskModel } from '../models/TaskModel.js';
import { EmployeeModel } from '../models/EmployeeModel.js';
import { RiskMatrixModel } from '../models/RiskMatrixModel.js';
import { ScenarioModel } from '../models/ScenarioModel.js';
import { CalculationResultModel } from '../models/CalculationResultModel.js';
import { compareScenarios } from '../core/index.js';
import { mapEmployee, mapMatrixCells, mapProject, mapScenario, mapTask } from '../utils/mappers.js';

// Возвращает список проектов для стартового экрана.
export async function getProjects(_req: Request, res: Response): Promise<void> {
  const projects = await ProjectModel.find().sort({ createdAt: -1 }).lean();
  res.json(projects.map(mapProject));
}

// Создает новый проект. На MVP достаточно базовых полей.
export async function createProject(req: Request, res: Response): Promise<void> {
  const id = req.body.id || `project-${Date.now()}`;
  const project = await ProjectModel.create({ _id: id, ...req.body });
  res.status(201).json(mapProject(project.toObject()));
}

// Возвращает все данные проекта одним объектом, чтобы интерфейс мог построить страницу.
export async function getProjectWorkspace(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params;

  const [projectDoc, taskDocs, employeeDocs, matrixDoc, scenarioDocs, lastResultDoc] = await Promise.all([
    ProjectModel.findById(projectId).lean(),
    TaskModel.find({ projectId }).sort({ order: 1 }).lean(),
    EmployeeModel.find().sort({ role: 1, grade: 1 }).lean(),
    RiskMatrixModel.findOne({ isDefault: true }).lean(),
    ScenarioModel.find({ projectId }).lean(),
    CalculationResultModel.findOne({ projectId }).sort({ calculatedAt: -1 }).lean(),
  ]);

  if (!projectDoc) {
    res.status(404).json({ message: 'Проект не найден' });
    return;
  }

  res.json({
    project: mapProject(projectDoc),
    tasks: taskDocs.map(mapTask),
    employees: employeeDocs.map(mapEmployee),
    matrix: matrixDoc ? mapMatrixCells(matrixDoc.cells) : [],
    scenarios: scenarioDocs.map(mapScenario),
    lastResult: lastResultDoc?.result ?? null,
  });
}

// Главный endpoint: достает данные из MongoDB, передает их в ядро и сохраняет результат.
export async function calculateProject(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params;

  const [projectDoc, taskDocs, employeeDocs, matrixDoc, scenarioDocs] = await Promise.all([
    ProjectModel.findById(projectId).lean(),
    TaskModel.find({ projectId }).sort({ order: 1 }).lean(),
    EmployeeModel.find().lean(),
    RiskMatrixModel.findOne({ isDefault: true }).lean(),
    ScenarioModel.find({ projectId }).lean(),
  ]);

  if (!projectDoc) {
    res.status(404).json({ message: 'Проект не найден' });
    return;
  }

  if (!matrixDoc) {
    res.status(400).json({ message: 'Не найдена матрица риска по умолчанию' });
    return;
  }

  const result = compareScenarios(
    mapProject(projectDoc),
    taskDocs.map(mapTask),
    employeeDocs.map(mapEmployee),
    scenarioDocs.map(mapScenario),
    mapMatrixCells(matrixDoc.cells)
  );

  await CalculationResultModel.create({
    projectId,
    calculatedAt: new Date(),
    recommendedScenarioId: result.recommendedScenarioId,
    bestAlternativeScenarioId: result.bestAlternativeScenarioId,
    result,
  });

  res.json(result);
}
