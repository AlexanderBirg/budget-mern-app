import { Schema, model } from 'mongoose';

// Исполнители задают ставку и квалификацию, от которых зависит стоимость и риск назначения.
const EmployeeSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    grade: { type: String, required: true },
    hourRate: { type: Number, required: true },
    availability: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

export const EmployeeModel = model('Employee', EmployeeSchema);
