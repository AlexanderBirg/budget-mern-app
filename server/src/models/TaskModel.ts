import { Schema, model } from 'mongoose';

// Задачи проекта являются базой расчета: у каждой есть трудоемкость, этап и сложность.
const TaskSchema = new Schema(
  {
    _id: { type: String, required: true },
    projectId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    stage: { type: String, required: true },
    baseHours: { type: Number, required: true },
    complexityLevel: { type: String, required: true },
    isCritical: { type: Boolean, required: true },
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

export const TaskModel = model('Task', TaskSchema);
