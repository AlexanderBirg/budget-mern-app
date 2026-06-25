import type { Employee, MatrixCell, Project, ProjectStage, ProjectTask, Scenario, ScenarioAssignment } from '../types/domain.js';
import type { ScenarioCalculationResult } from '../types/result.js';
import { CalculationError } from '../types/errors.js';
import { calculateScenarioResult } from '../calculation/calculateScenarioResult.js';

export interface ScenarioOptimizationOptions {
  populationSize?: number;
  generations?: number;
  mutationRate?: number;
  teamFitCoefficient?: number;
  deltaMode?: Scenario['deltaMode'];
  scenarioName?: string;
}

export interface ScenarioOptimizationResult {
  scenario: Scenario;
  result: ScenarioCalculationResult;
  meta: {
    populationSize: number;
    generations: number;
    mutationRate: number;
    evaluatedVariants: number;
    bestFitness: number;
    feasibleFound: boolean;
  };
}

interface Candidate {
  assignmentEmployeeIds: string[];
  fitness: number;
  result: ScenarioCalculationResult | null;
}

const stageRoleMap: Record<ProjectStage, string[]> = {
  analytics: ['analytics', 'analyst'],
  design: ['design', 'designer'],
  frontend: ['frontend'],
  backend: ['backend'],
  integration: ['integration', 'backend'],
  qa: ['qa', 'test', 'tester'],
  deployment: ['deployment', 'devops'],
};

function normalizeRole(role: string): string {
  return role.trim().toLowerCase();
}

// Генетический алгоритм формирует новый сценарий назначений.
// В роли хромосомы используется массив employeeId: каждая позиция соответствует одной задаче.
export function optimizeScenarioAssignments(
  project: Project,
  tasks: ProjectTask[],
  employees: Employee[],
  matrix: MatrixCell[],
  options: ScenarioOptimizationOptions = {}
): ScenarioOptimizationResult {
  if (tasks.length === 0) {
    throw new CalculationError('INVALID_INPUT', 'Нельзя выполнить автоподбор: в проекте нет задач', { projectId: project.id });
  }

  if (employees.length === 0) {
    throw new CalculationError('INVALID_INPUT', 'Нельзя выполнить автоподбор: в справочнике нет исполнителей', { projectId: project.id });
  }

  const populationSize = clampInteger(options.populationSize ?? 40, 10, 120);
  const generations = clampInteger(options.generations ?? 60, 5, 250);
  const mutationRate = clampNumber(options.mutationRate ?? 0.12, 0.01, 0.6);
  const teamFitCoefficient = clampNumber(options.teamFitCoefficient ?? 0.88, 0.1, 1);
  const deltaMode = options.deltaMode ?? 'criticalOnly';
  const scenarioId = `scenario-ga-${Date.now()}`;

  const employeePoolByTask = tasks.map(task => getAllowedEmployeesForTask(task, employees));
  let population = buildInitialPopulation(tasks, employeePoolByTask, populationSize);
  let best: Candidate | null = null;
  let evaluatedVariants = 0;

  for (let generation = 0; generation < generations; generation += 1) {
    const evaluated = population
      .map(candidate => evaluateCandidate(candidate, project, tasks, employees, matrix, scenarioId, teamFitCoefficient, deltaMode))
      .sort((a, b) => b.fitness - a.fitness);

    evaluatedVariants += evaluated.length;

    if (!best || evaluated[0].fitness > best.fitness) {
      best = evaluated[0];
    }

    const eliteCount = Math.max(2, Math.round(populationSize * 0.2));
    const elite = evaluated.slice(0, eliteCount);
    const nextPopulation: Candidate[] = elite.map(candidate => ({ ...candidate, result: null }));

    while (nextPopulation.length < populationSize) {
      const parentA = selectParent(evaluated);
      const parentB = selectParent(evaluated);
      const childGenes = crossover(parentA.assignmentEmployeeIds, parentB.assignmentEmployeeIds);
      const mutatedGenes = mutate(childGenes, employeePoolByTask, mutationRate);
      nextPopulation.push({ assignmentEmployeeIds: mutatedGenes, fitness: Number.NEGATIVE_INFINITY, result: null });
    }

    population = nextPopulation;
  }

  if (!best) {
    throw new CalculationError('INVALID_INPUT', 'Не удалось сформировать оптимизированный сценарий', { projectId: project.id });
  }

  const scenario = buildScenarioFromGenes(
    scenarioId,
    options.scenarioName || 'D — автоматически подобранный',
    'Сценарий сформирован модулем автоматического подбора на основе генетического алгоритма.',
    project.id,
    tasks,
    best.assignmentEmployeeIds,
    teamFitCoefficient,
    deltaMode
  );

  const result = best.result || calculateScenarioResult(project, tasks, employees, scenario, matrix);

  return {
    scenario,
    result,
    meta: {
      populationSize,
      generations,
      mutationRate,
      evaluatedVariants,
      bestFitness: round(best.fitness, 4),
      feasibleFound: result.constraints.isFeasible,
    },
  };
}

function buildInitialPopulation(tasks: ProjectTask[], employeePoolByTask: Employee[][], populationSize: number): Candidate[] {
  const population: Candidate[] = [];

  // Первый кандидат строится жадно: для каждой задачи берется исполнитель с лучшим грейдом из допустимой роли.
  population.push({
    assignmentEmployeeIds: tasks.map((_task, index) => selectBestGradeEmployee(employeePoolByTask[index]).id),
    fitness: Number.NEGATIVE_INFINITY,
    result: null,
  });

  while (population.length < populationSize) {
    population.push({
      assignmentEmployeeIds: employeePoolByTask.map(pool => randomFrom(pool).id),
      fitness: Number.NEGATIVE_INFINITY,
      result: null,
    });
  }

  return population;
}

function evaluateCandidate(
  candidate: Candidate,
  project: Project,
  tasks: ProjectTask[],
  employees: Employee[],
  matrix: MatrixCell[],
  scenarioId: string,
  teamFitCoefficient: number,
  deltaMode: Scenario['deltaMode']
): Candidate {
  const scenario = buildScenarioFromGenes(
    scenarioId,
    'Кандидат автоподбора',
    '',
    project.id,
    tasks,
    candidate.assignmentEmployeeIds,
    teamFitCoefficient,
    deltaMode
  );

  try {
    const result = calculateScenarioResult(project, tasks, employees, scenario, matrix);
    return {
      ...candidate,
      result,
      fitness: calculateFitness(project, result),
    };
  } catch (_err) {
    // Некорректные кандидаты получают большой штраф и практически не проходят в следующее поколение.
    return {
      ...candidate,
      result: null,
      fitness: Number.NEGATIVE_INFINITY,
    };
  }
}

function calculateFitness(project: Project, result: ScenarioCalculationResult): number {
  const budgetOverrun = Math.max(0, result.expectedBudget - project.budgetLimit);
  const deadlineOverrun = Math.max(0, result.maxDays - project.deadlineDays);
  const stabilityDeficit = Math.max(0, project.minStabilityIndex - result.stabilityIndex);
  const assignmentRiskPenalty = result.constraints.assignmentRiskOk ? 0 : 1;

  // Функция приспособленности отражает компромисс: дешевле, быстрее, устойчивее.
  // Нарушения ограничений получают крупные штрафы, поэтому допустимые сценарии имеют преимущество.
  const feasibilityBonus = result.constraints.isFeasible ? 50_000 : 0;
  const stabilityReward = result.stabilityIndex * 12_000;
  const budgetPenalty = result.expectedBudget / 1_000;
  const durationPenalty = result.maxDays * 80;
  const overrunPenalty = budgetOverrun / 50 + deadlineOverrun * 2_500 + stabilityDeficit * 30_000 + assignmentRiskPenalty * 20_000;

  return feasibilityBonus + stabilityReward - budgetPenalty - durationPenalty - overrunPenalty;
}

function buildScenarioFromGenes(
  id: string,
  name: string,
  description: string,
  projectId: string,
  tasks: ProjectTask[],
  employeeIds: string[],
  teamFitCoefficient: number,
  deltaMode: Scenario['deltaMode']
): Scenario {
  const assignments: ScenarioAssignment[] = tasks.map((task, index) => ({
    taskId: task.id,
    employeeId: employeeIds[index],
    allocation: 1,
  }));

  return {
    id,
    projectId,
    name,
    description,
    teamFitCoefficient,
    deltaMode,
    assignments,
  };
}

function crossover(parentA: string[], parentB: string[]): string[] {
  if (parentA.length <= 1) return [...parentA];

  const splitPoint = Math.floor(Math.random() * (parentA.length - 1)) + 1;
  return [...parentA.slice(0, splitPoint), ...parentB.slice(splitPoint)];
}

function mutate(genes: string[], employeePoolByTask: Employee[][], mutationRate: number): string[] {
  return genes.map((employeeId, index) => {
    if (Math.random() > mutationRate) return employeeId;
    return randomFrom(employeePoolByTask[index]).id;
  });
}

function selectParent(population: Candidate[]): Candidate {
  const tournamentSize = Math.min(4, population.length);
  const candidates = Array.from({ length: tournamentSize }, () => randomFrom(population));
  return candidates.sort((a, b) => b.fitness - a.fitness)[0];
}

function getAllowedEmployeesForTask(task: ProjectTask, employees: Employee[]): Employee[] {
  const allowedRoles = stageRoleMap[task.stage] || [];
  const matched = employees.filter(employee => allowedRoles.includes(normalizeRole(employee.role)));

  // Если по роли никого нет, не останавливаем оптимизацию полностью,
  // но даем алгоритму выбрать из всех исполнителей. Диагностика сценария потом покажет риски.
  return matched.length > 0 ? matched : employees;
}

function selectBestGradeEmployee(employees: Employee[]): Employee {
  const gradeScore: Record<Employee['grade'], number> = {
    intern: 1,
    junior: 2,
    middle: 3,
    senior: 4,
  };

  return [...employees].sort((a, b) => {
    const gradeDiff = gradeScore[b.grade] - gradeScore[a.grade];
    if (gradeDiff !== 0) return gradeDiff;
    return a.hourRate - b.hourRate;
  })[0];
}

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, precision = 2): number {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}
