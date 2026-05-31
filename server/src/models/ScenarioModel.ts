import { Schema, model } from 'mongoose';

// Назначение связывает конкретную задачу с конкретным исполнителем.
const AssignmentSchema = new Schema(
  {
    taskId: { type: String, required: true },
    employeeId: { type: String, required: true },
    allocation: { type: Number, required: true, default: 1 },
  },
  { _id: false }
);

// Сценарий хранит вариант команды: кто какую задачу выполняет.
const ScenarioSchema = new Schema(
  {
    _id: { type: String, required: true },
    projectId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    teamFitCoefficient: { type: Number, required: true },
    deltaMode: { type: String, required: true, default: 'criticalOnly' },
    assignments: { type: [AssignmentSchema], required: true },
  },
  { timestamps: true }
);

export const ScenarioModel = model('Scenario', ScenarioSchema);
