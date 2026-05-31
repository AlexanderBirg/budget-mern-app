import { Schema, model } from 'mongoose';

// Результат расчета сохраняется целиком, чтобы его можно было открыть позже.
const CalculationResultSchema = new Schema(
  {
    projectId: { type: String, required: true, index: true },
    calculatedAt: { type: Date, required: true },
    recommendedScenarioId: { type: String },
    bestAlternativeScenarioId: { type: String },
    result: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const CalculationResultModel = model('CalculationResult', CalculationResultSchema);
