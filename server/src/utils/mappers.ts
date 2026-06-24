import type { Employee, MatrixCell, Project, ProjectTask, Scenario } from '../core/types/domain.js';

// Mongoose возвращает поле _id, а расчетное ядро ожидает поле id.
// Эти функции приводят документы MongoDB к формату расчетного ядра.
export function mapProject(doc: any): Project {
  return {
    id: String(doc._id),
    name: doc.name,
    description: doc.description,
    budgetLimit: doc.budgetLimit,
    deadlineDays: doc.deadlineDays,
    minStabilityIndex: doc.minStabilityIndex,
    workHoursPerDay: doc.workHoursPerDay,
    minAllowedProbability: doc.minAllowedProbability,
  };
}

export function mapTask(doc: any): ProjectTask {
  return {
    id: String(doc._id),
    projectId: doc.projectId,
    name: doc.name,
    stage: doc.stage,
    baseHours: doc.baseHours,
    complexityLevel: doc.complexityLevel,
    isCritical: doc.isCritical,
    order: doc.order,
    planningStep: Number.isFinite(Number(doc.planningStep)) ? Number(doc.planningStep) : undefined,
    dependsOnTaskIds: Array.isArray(doc.dependsOnTaskIds) ? doc.dependsOnTaskIds : [],
  };
}

export function mapEmployee(doc: any): Employee {
  return {
    id: String(doc._id),
    name: doc.name,
    role: doc.role,
    grade: doc.grade,
    hourRate: doc.hourRate,
    availability: doc.availability,
  };
}

export function mapScenario(doc: any): Scenario {
  return {
    id: String(doc._id),
    projectId: doc.projectId,
    name: doc.name,
    description: doc.description,
    teamFitCoefficient: doc.teamFitCoefficient,
    deltaMode: doc.deltaMode,
    assignments: doc.assignments,
  };
}

export function mapMatrixCells(cells: any[]): MatrixCell[] {
  return cells.map(cell => ({
    grade: cell.grade,
    complexityLevel: cell.complexityLevel,
    probability: cell.probability,
    deltaDays: cell.deltaDays,
  }));
}
