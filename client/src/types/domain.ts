export type GradeCode = 'intern' | 'junior' | 'middle' | 'senior';
export type ComplexityLevel = 'L1' | 'L2' | 'L3' | 'L4';
export type ProjectStage = 'analytics' | 'design' | 'frontend' | 'backend' | 'integration' | 'qa' | 'deployment';

export interface Project {
  id: string;
  name: string;
  description?: string;
  budgetLimit: number;
  deadlineDays: number;
  minStabilityIndex: number;
  workHoursPerDay: number;
  minAllowedProbability: number;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  name: string;
  stage: ProjectStage;
  baseHours: number;
  complexityLevel: ComplexityLevel;
  isCritical: boolean;
  order: number;
  dependsOnTaskIds: string[];
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  grade: GradeCode;
  hourRate: number;
  availability: number;
}

export interface MatrixCell {
  grade: GradeCode;
  complexityLevel: ComplexityLevel;
  probability: number;
  deltaDays: number;
}

export interface ScenarioAssignment {
  taskId: string;
  employeeId: string;
  allocation: number;
}

export interface Scenario {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  teamFitCoefficient: number;
  deltaMode: 'allTasks' | 'criticalOnly';
  assignments: ScenarioAssignment[];
}

export interface TaskCalculationResult {
  taskId: string;
  taskName: string;
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
  isCritical: boolean;
  stage: ProjectStage;
  isAssignmentAllowed: boolean;
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
  diagnostics?: ConstraintDiagnostic[];
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

export interface ScenarioCalculationResult {
  scenarioId: string;
  scenarioName: string;
  taskResults: TaskCalculationResult[];
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
  schedule: TaskScheduleItem[];
  stageDurations?: Array<{ stage: ProjectStage; expectedHours: number; capacityHoursPerDay: number; durationDays: number }>;
}

export interface ComparisonResult {
  projectId: string;
  recommendedScenarioId: string | null;
  bestAlternativeScenarioId: string | null;
  results: ScenarioCalculationResult[];
}

export interface Workspace {
  project: Project;
  tasks: ProjectTask[];
  employees: Employee[];
  matrix: MatrixCell[];
  scenarios: Scenario[];
  lastResult: ComparisonResult | null;
}


export interface OptimizationMeta {
  populationSize: number;
  generations: number;
  mutationRate: number;
  evaluatedVariants: number;
  bestFitness: number;
  feasibleFound: boolean;
}

export interface OptimizeProjectResponse {
  scenario: Scenario;
  result: ScenarioCalculationResult;
  comparison: ComparisonResult;
  optimization: OptimizationMeta;
}
