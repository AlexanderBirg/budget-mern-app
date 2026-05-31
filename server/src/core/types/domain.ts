export type GradeCode = 'intern' | 'junior' | 'middle' | 'senior';
export type ComplexityLevel = 'L1' | 'L2' | 'L3' | 'L4';

export type ProjectStage =
  | 'analytics'
  | 'design'
  | 'frontend'
  | 'backend'
  | 'integration'
  | 'qa'
  | 'deployment';

export type DeltaMode = 'allTasks' | 'criticalOnly';

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
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  grade: GradeCode;
  hourRate: number;
  availability: number; // 1 = полная занятость, 0.5 = половина занятости
}

export interface MatrixCell {
  grade: GradeCode;
  complexityLevel: ComplexityLevel;
  probability: number; // p(g,l), значение от 0 до 1
  deltaDays: number;   // δ(g,l), дни неопределенности
}

export interface ScenarioAssignment {
  taskId: string;
  employeeId: string;
  allocation: number; // 1 = полное назначение, 0.5 = половина назначения
}

export interface Scenario {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  teamFitCoefficient: number; // q_s, коэффициент слаженности от 0 до 1
  deltaMode: DeltaMode;
  assignments: ScenarioAssignment[];
}
