import type { Project } from '../types/domain.js';
import type { ConstraintCheckResult, ConstraintDiagnostic } from '../types/result.js';

interface CheckConstraintsInput {
  project: Project;
  expectedBudget: number;
  expectedCalendarDays: number;
  deltaDays: number;
  stabilityIndex: number;
  forbiddenAssignmentMessages: string[];
}

export function checkConstraints(input: CheckConstraintsInput): ConstraintCheckResult {
  const {
    project,
    expectedBudget,
    expectedCalendarDays,
    deltaDays,
    stabilityIndex,
    forbiddenAssignmentMessages,
  } = input;

  const maxDays = expectedCalendarDays + deltaDays;

  const budgetOk = expectedBudget <= project.budgetLimit;
  const deadlineOk = maxDays <= project.deadlineDays;
  const stabilityOk = stabilityIndex >= project.minStabilityIndex;
  const assignmentRiskOk = forbiddenAssignmentMessages.length === 0;

  const diagnostics: ConstraintDiagnostic[] = [
    {
      code: 'budget',
      label: 'Бюджет',
      ok: budgetOk,
      actual: round(expectedBudget),
      limit: project.budgetLimit,
      difference: round(project.budgetLimit - expectedBudget),
      unit: 'rub',
      message: budgetOk
        ? `Бюджет укладывается в ограничение: ${formatMoney(expectedBudget)} из ${formatMoney(project.budgetLimit)}. Резерв: ${formatMoney(project.budgetLimit - expectedBudget)}.`
        : `Бюджет превышен: ${formatMoney(expectedBudget)} при лимите ${formatMoney(project.budgetLimit)}. Превышение: ${formatMoney(expectedBudget - project.budgetLimit)}.`,
    },
    {
      code: 'deadline',
      label: 'Срок с учетом δ',
      ok: deadlineOk,
      actual: round(maxDays),
      limit: project.deadlineDays,
      difference: round(project.deadlineDays - maxDays),
      unit: 'days',
      message: deadlineOk
        ? `Срок укладывается в ограничение: ${formatDays(maxDays)} из ${formatDays(project.deadlineDays)}. Резерв: ${formatDays(project.deadlineDays - maxDays)}.`
        : `Срок превышен: ${formatDays(maxDays)} при лимите ${formatDays(project.deadlineDays)}. Превышение: ${formatDays(maxDays - project.deadlineDays)}.`,
    },
    {
      code: 'stability',
      label: 'Индекс устойчивости',
      ok: stabilityOk,
      actual: round(stabilityIndex, 4),
      limit: project.minStabilityIndex,
      difference: round(stabilityIndex - project.minStabilityIndex, 4),
      unit: 'index',
      message: stabilityOk
        ? `Устойчивость достаточная: ${formatIndex(stabilityIndex)} при минимуме ${formatIndex(project.minStabilityIndex)}. Запас: ${formatIndex(stabilityIndex - project.minStabilityIndex)}.`
        : `Устойчивость ниже минимума: ${formatIndex(stabilityIndex)} при минимуме ${formatIndex(project.minStabilityIndex)}. Недостаток: ${formatIndex(project.minStabilityIndex - stabilityIndex)}.`,
    },
    {
      code: 'assignmentRisk',
      label: 'Критически рискованные назначения',
      ok: assignmentRiskOk,
      actual: forbiddenAssignmentMessages.length,
      limit: 0,
      difference: -forbiddenAssignmentMessages.length,
      unit: 'items',
      message: assignmentRiskOk
        ? 'Критически рискованных назначений нет.'
        : `Есть критически рискованные назначения: ${forbiddenAssignmentMessages.join('; ')}.`,
    },
  ];

  const reasons = diagnostics
    .filter(item => !item.ok)
    .map(item => item.message);

  return {
    budgetOk,
    deadlineOk,
    stabilityOk,
    assignmentRiskOk,
    isFeasible: budgetOk && deadlineOk && stabilityOk && assignmentRiskOk,
    reasons,
    diagnostics,
  };
}

function formatMoney(value: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(Math.round(value))} ₽`;
}

function formatDays(value: number): string {
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(round(value))} дн.`;
}

function formatIndex(value: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 4 }).format(round(value, 4));
}

function round(value: number, precision = 2): number {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}
