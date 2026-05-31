import type { ComplexityLevel, GradeCode, MatrixCell } from '../types/domain.js';
import { CalculationError } from '../types/errors.js';

export function getMatrixCell(
  matrix: MatrixCell[],
  grade: GradeCode,
  complexityLevel: ComplexityLevel
): MatrixCell {
  const cell = matrix.find(
    item => item.grade === grade && item.complexityLevel === complexityLevel
  );

  if (!cell) {
    throw new CalculationError(
      'MATRIX_CELL_NOT_FOUND',
      `No matrix cell found for grade=${grade}, complexity=${complexityLevel}`,
      { grade, complexityLevel }
    );
  }

  if (cell.probability <= 0 || cell.probability > 1) {
    throw new CalculationError(
      'INVALID_PROBABILITY',
      `Probability must be in range (0, 1], got ${cell.probability}`,
      { grade, complexityLevel, probability: cell.probability }
    );
  }

  if (cell.deltaDays < 0) {
    throw new CalculationError(
      'INVALID_DELTA_DAYS',
      `Delta days must be non-negative, got ${cell.deltaDays}`,
      { grade, complexityLevel, deltaDays: cell.deltaDays }
    );
  }

  return cell;
}
