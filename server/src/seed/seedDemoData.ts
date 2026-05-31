import 'dotenv/config';
import mongoose from 'mongoose';
import { connectToDatabase } from '../db/connect.js';
import { ProjectModel } from '../models/ProjectModel.js';
import { TaskModel } from '../models/TaskModel.js';
import { EmployeeModel } from '../models/EmployeeModel.js';
import { RiskMatrixModel } from '../models/RiskMatrixModel.js';
import { ScenarioModel } from '../models/ScenarioModel.js';
import { CalculationResultModel } from '../models/CalculationResultModel.js';
import { demoEmployees, demoMatrix, demoProject, demoScenarios, demoTasks } from '../core/fixtures/demoData.js';

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/budget_app';
await connectToDatabase(mongoUri);

// Seed-скрипт очищает демонстрационные коллекции и заново загружает учебный пример.
await Promise.all([
  ProjectModel.deleteMany({}),
  TaskModel.deleteMany({}),
  EmployeeModel.deleteMany({}),
  RiskMatrixModel.deleteMany({}),
  ScenarioModel.deleteMany({}),
  CalculationResultModel.deleteMany({}),
]);

await ProjectModel.create({ _id: demoProject.id, ...demoProject });
await TaskModel.insertMany(demoTasks.map(task => ({ _id: task.id, ...task })));
await EmployeeModel.insertMany(demoEmployees.map(employee => ({ _id: employee.id, ...employee })));
await RiskMatrixModel.create({
  _id: 'risk-matrix-expert-v1',
  name: 'Экспертная матрица v1',
  version: '1.0',
  isDefault: true,
  cells: demoMatrix,
});
await ScenarioModel.insertMany(demoScenarios.map(scenario => ({ _id: scenario.id, ...scenario })));

console.log('Демонстрационные данные загружены в MongoDB');
await mongoose.disconnect();
