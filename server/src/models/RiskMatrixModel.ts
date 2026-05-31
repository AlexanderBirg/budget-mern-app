import { Schema, model } from 'mongoose';

// Матрица хранит значения p(g,l) и δ(g,l) для пар «грейд — сложность».
const MatrixCellSchema = new Schema(
  {
    grade: { type: String, required: true },
    complexityLevel: { type: String, required: true },
    probability: { type: Number, required: true },
    deltaDays: { type: Number, required: true },
  },
  { _id: false }
);

const RiskMatrixSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    version: { type: String, required: true },
    isDefault: { type: Boolean, required: true, default: false },
    cells: { type: [MatrixCellSchema], required: true },
  },
  { timestamps: true }
);

export const RiskMatrixModel = model('RiskMatrix', RiskMatrixSchema);
