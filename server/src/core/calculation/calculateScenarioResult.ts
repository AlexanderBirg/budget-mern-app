import type { Employee, MatrixCell, Project, ProjectTask, Scenario } from '../types/domain.js';
import type { ScenarioCalculationResult, TaskCalculationResult } from '../types/result.js';
import { CalculationError } from '../types/errors.js';
import { getMatrixCell } from './getMatrixCell.js';
import { calculateTaskResult } from './calculateTaskResult.js';
import { calculateScenarioDuration } from './calculateScenarioDuration.js';
import { checkConstraints } from './checkConstraints.js';

export function calculateScenarioResult(
  project: Project,
  tasks: ProjectTask[],
  employees: Employee[],
  scenario: Scenario,
  matrix: MatrixCell[]
): ScenarioCalculationResult {
  validateScenario(project, tasks, scenario);

  const taskResults: TaskCalculationResult[] = scenario.assignments.map(assignment => {
    const task = tasks.find(item => item.id === assignment.taskId);
    if (!task) {
      throw new CalculationError('TASK_NOT_FOUND', `Task not found: ${assignment.taskId}`, { assignment });
    }

    const employee = employees.find(item => item.id === assignment.employeeId);
    if (!employee) {
      throw new CalculationError('EMPLOYEE_NOT_FOUND', `Employee not found: ${assignment.employeeId}`, { assignment });
    }

    if (assignment.allocation <= 0 || assignment.allocation > 1) {
      throw new CalculationError(
        'INVALID_ALLOCATION',
        `Assignment allocation must be in range (0, 1], got ${assignment.allocation}`,
        { assignment }
      );
    }

    const matrixCell = getMatrixCell(matrix, employee.grade, task.complexityLevel);
    return calculateTaskResult(project, task, employee, matrixCell);
  });

  const expectedHours = sum(taskResults.map(item => item.expectedHours));
  const expectedLaborDays = expectedHours / project.workHoursPerDay;
  const expectedBudget = sum(taskResults.map(item => item.cost));

  const { schedule, expectedCalendarDays } = calculateScenarioDuration(
    tasks,
    taskResults,
    scenario.assignments,
    project.workHoursPerDay
  );

  // Для обратной совместимости и краткой аналитики группируем расписание по этапам.
  const stageDurations = buildStageDurations(schedule);

  const deltaSource = scenario.deltaMode === 'criticalOnly'
    ? taskResults.filter(item => item.isCritical)
    : taskResults;

  const deltaDays = sum(deltaSource.map(item => item.deltaDays));
  const minDays = Math.max(0, expectedCalendarDays - deltaDays);
  const maxDays = expectedCalendarDays + deltaDays;

  const probabilities = taskResults.map(item => item.probability);
  const averageReliability = probabilities.length ? average(probabilities) : 0;
  const strictReliability = probabilities.reduce((product, probability) => product * probability, 1);
  const stabilityIndex = averageReliability * scenario.teamFitCoefficient;
  const riskIndex = 1 - stabilityIndex;
  const hasForbiddenAssignments = taskResults.some(item => !item.isAssignmentAllowed);

  const constraints = checkConstraints({
    project,
    expectedBudget,
    expectedCalendarDays,
    deltaDays,
    stabilityIndex,
    hasForbiddenAssignments,
  });

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    taskResults,
    stageDurations,
    schedule,
    expectedHours: round(expectedHours),
    expectedLaborDays: round(expectedLaborDays),
    expectedCalendarDays: round(expectedCalendarDays),
    expectedBudget: round(expectedBudget),
    deltaDays: round(deltaDays),
    minDays: round(minDays),
    maxDays: round(maxDays),
    averageReliability: round(averageReliability, 4),
    strictReliability: round(strictReliability, 4),
    teamFitCoefficient: scenario.teamFitCoefficient,
    stabilityIndex: round(stabilityIndex, 4),
    riskIndex: round(riskIndex, 4),
    constraints,
  };
}

function validateScenario(project: Project, tasks: ProjectTask[], scenario: Scenario): void {
  if (scenario.projectId !== project.id) {
    throw new CalculationError(
      'SCENARIO_PROJECT_MISMATCH',
      `Scenario ${scenario.id} does not belong to project ${project.id}`,
      { scenarioId: scenario.id, projectId: project.id }
    );
  }

  if (scenario.teamFitCoefficient <= 0 || scenario.teamFitCoefficient > 1) {
    throw new CalculationError(
      'INVALID_TEAM_FIT_COEFFICIENT',
      `teamFitCoefficient must be in range (0, 1], got ${scenario.teamFitCoefficient}`,
      { scenarioId: scenario.id, teamFitCoefficient: scenario.teamFitCoefficient }
    );
  }

  const assignedTaskIds = new Set(scenario.assignments.map(item => item.taskId));
  const missingTasks = tasks.filter(task => !assignedTaskIds.has(task.id));

  if (missingTasks.length > 0) {
    throw new CalculationError(
      'TASKS_WITHOUT_ASSIGNMENT',
      `Scenario ${scenario.id} does not have assignments for all project tasks`,
      { missingTaskIds: missingTasks.map(task => task.id) }
    );
  }
}


function buildStageDurations(schedule: ScenarioCalculationResult['schedule']): ScenarioCalculationResult['stageDurations'] {
  const grouped = new Map<string, { stage: any; expectedHours: number; durationDays: number }>();

  for (const item of schedule) {
    const current = grouped.get(item.stage) || { stage: item.stage, expectedHours: 0, durationDays: 0 };
    current.durationDays += item.durationDays;
    grouped.set(item.stage, current);
  }

  return Array.from(grouped.values()).map(item => ({
    stage: item.stage,
    expectedHours: 0,
    capacityHoursPerDay: 0,
    durationDays: round(item.durationDays),
  }));
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]): number {
  return sum(values) / values.length;
}

function round(value: number, precision = 2): number {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}
