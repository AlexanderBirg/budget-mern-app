import { Schema, model } from 'mongoose';

// Проект хранит общие ограничения, с которыми затем сравниваются сценарии.
const ProjectSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    budgetLimit: { type: Number, required: true },
    deadlineDays: { type: Number, required: true },
    minStabilityIndex: { type: Number, required: true },
    workHoursPerDay: { type: Number, required: true },
    minAllowedProbability: { type: Number, required: true },
  },
  { timestamps: true }
);

export const ProjectModel = model('Project', ProjectSchema);
