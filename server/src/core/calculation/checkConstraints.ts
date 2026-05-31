import type { Project } from '../types/domain.js';
import type { ConstraintCheckResult } from '../types/result.js';

interface CheckConstraintsInput {
  project: Project;
  expectedBudget: number;
  expectedCalendarDays: number;
  deltaDays: number;
  stabilityIndex: number;
  hasForbiddenAssignments: boolean;
}

export function checkConstraints(input: CheckConstraintsInput): ConstraintCheckResult {
  const {
    project,
    expectedBudget,
    expectedCalendarDays,
    deltaDays,
    stabilityIndex,
    hasForbiddenAssignments,
  } = input;

  const budgetOk = expectedBudget <= project.budgetLimit;
  const deadlineOk = expectedCalendarDays + deltaDays <= project.deadlineDays;
  const stabilityOk = stabilityIndex >= project.minStabilityIndex;
  const assignmentRiskOk = !hasForbiddenAssignments;

  const reasons: string[] = [];

  if (!budgetOk) {
    reasons.push(`Бюджет превышает ограничение: ${expectedBudget} > ${project.budgetLimit}`);
  }

  if (!deadlineOk) {
    reasons.push(
      `Срок с учетом неопределенности превышает ограничение: ${round(expectedCalendarDays + deltaDays)} > ${project.deadlineDays}`
    );
  }

  if (!stabilityOk) {
    reasons.push(
      `Индекс устойчивости ниже минимального порога: ${round(stabilityIndex, 4)} < ${project.minStabilityIndex}`
    );
  }

  if (!assignmentRiskOk) {
    reasons.push('В сценарии есть назначения с критически низкой надежностью');
  }

  return {
    budgetOk,
    deadlineOk,
    stabilityOk,
    assignmentRiskOk,
    isFeasible: budgetOk && deadlineOk && stabilityOk && assignmentRiskOk,
    reasons,
  };
}

function round(value: number, precision = 2): number {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}
