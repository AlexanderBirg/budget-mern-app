import type { ComplexityLevel, GradeCode, ProjectStage } from './domain.js';

export interface TaskCalculationResult {
  taskId: string;
  taskName: string;
  stage: ProjectStage;
  isCritical: boolean;

  employeeId: string;
  employeeName: string;
  grade: GradeCode;

  complexityLevel: ComplexityLevel;
  baseHours: number;
  probability: number;
  expectedHours: number;
  hourRate: number;
  cost: number;
  deltaDays: number;
  riskContribution: number;
  isAssignmentAllowed: boolean;
}

export interface StageDurationResult {
  stage: ProjectStage;
  expectedHours: number;
  capacityHoursPerDay: number;
  durationDays: number;
}

export interface TaskScheduleItem {
  taskId: string;
  taskName: string;
  stage: ProjectStage;
  employeeId: string;
  employeeName: string;
  startDay: number;
  endDay: number;
  durationDays: number;
  dependsOnTaskIds: string[];
  isCritical: boolean;
}

export type ConstraintDiagnosticCode = 'budget' | 'deadline' | 'stability' | 'assignmentRisk';

export interface ConstraintDiagnostic {
  code: ConstraintDiagnosticCode;
  label: string;
  ok: boolean;
  actual: number;
  limit: number;
  difference: number;
  unit: 'rub' | 'days' | 'index' | 'items';
  message: string;
}

export interface ConstraintCheckResult {
  budgetOk: boolean;
  deadlineOk: boolean;
  stabilityOk: boolean;
  assignmentRiskOk: boolean;
  isFeasible: boolean;
  reasons: string[];
  diagnostics: ConstraintDiagnostic[];
}

export interface ScenarioCalculationResult {
  scenarioId: string;
  scenarioName: string;
  taskResults: TaskCalculationResult[];
  stageDurations: StageDurationResult[];
  schedule: TaskScheduleItem[];

  expectedHours: number;
  expectedLaborDays: number;
  expectedCalendarDays: number;
  expectedBudget: number;

  deltaDays: number;
  minDays: number;
  maxDays: number;

  averageReliability: number;
  strictReliability: number;
  teamFitCoefficient: number;
  stabilityIndex: number;
  riskIndex: number;

  constraints: ConstraintCheckResult;
}

export interface ComparisonResult {
  projectId: string;
  recommendedScenarioId: string | null;
  bestAlternativeScenarioId: string | null;
  results: ScenarioCalculationResult[];
}
