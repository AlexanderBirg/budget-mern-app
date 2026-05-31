import type { Employee, MatrixCell, Project, ProjectTask } from '../types/domain.js';
import type { TaskCalculationResult } from '../types/result.js';
import { CalculationError } from '../types/errors.js';

export function calculateTaskResult(
  project: Project,
  task: ProjectTask,
  employee: Employee,
  matrixCell: MatrixCell
): TaskCalculationResult {
  if (task.baseHours <= 0) {
    throw new CalculationError(
      'INVALID_BASE_HOURS',
      `Task baseHours must be positive, got ${task.baseHours}`,
      { taskId: task.id, baseHours: task.baseHours }
    );
  }

  if (employee.hourRate <= 0) {
    throw new CalculationError(
      'INVALID_HOUR_RATE',
      `Employee hourRate must be positive, got ${employee.hourRate}`,
      { employeeId: employee.id, hourRate: employee.hourRate }
    );
  }

  if (employee.availability <= 0 || employee.availability > 1) {
    throw new CalculationError(
      'INVALID_AVAILABILITY',
      `Employee availability must be in range (0, 1], got ${employee.availability}`,
      { employeeId: employee.id, availability: employee.availability }
    );
  }

  const expectedHours = task.baseHours / matrixCell.probability;
  const cost = expectedHours * employee.hourRate;
  const riskContribution = 1 - matrixCell.probability;
  const isAssignmentAllowed = matrixCell.probability >= project.minAllowedProbability;

  return {
    taskId: task.id,
    taskName: task.name,
    stage: task.stage,
    isCritical: task.isCritical,
    employeeId: employee.id,
    employeeName: employee.name,
    grade: employee.grade,
    complexityLevel: task.complexityLevel,
    baseHours: round(task.baseHours),
    probability: round(matrixCell.probability, 4),
    expectedHours: round(expectedHours),
    hourRate: round(employee.hourRate),
    cost: round(cost),
    deltaDays: round(matrixCell.deltaDays),
    riskContribution: round(riskContribution, 4),
    isAssignmentAllowed,
  };
}

function round(value: number, precision = 2): number {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}
