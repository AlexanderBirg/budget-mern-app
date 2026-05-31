import type { Employee, MatrixCell, Project, ProjectTask, Scenario } from '../types/domain.js';
import type { ComparisonResult, ScenarioCalculationResult } from '../types/result.js';
import { calculateScenarioResult } from './calculateScenarioResult.js';

export function compareScenarios(
  project: Project,
  tasks: ProjectTask[],
  employees: Employee[],
  scenarios: Scenario[],
  matrix: MatrixCell[]
): ComparisonResult {
  const results = scenarios
    .map(scenario => calculateScenarioResult(project, tasks, employees, scenario, matrix))
    .sort((a, b) => a.expectedBudget - b.expectedBudget);

  const feasibleResults = results.filter(result => result.constraints.isFeasible);

  const recommended = feasibleResults.length > 0
    ? feasibleResults[0]
    : null;

  const bestAlternative = recommended
    ? null
    : selectBestAlternative(results);

  return {
    projectId: project.id,
    recommendedScenarioId: recommended?.scenarioId ?? null,
    bestAlternativeScenarioId: bestAlternative?.scenarioId ?? null,
    results,
  };
}

function selectBestAlternative(results: ScenarioCalculationResult[]): ScenarioCalculationResult | null {
  if (results.length === 0) return null;

  return [...results].sort((a, b) => {
    const violationsA = countViolations(a);
    const violationsB = countViolations(b);

    if (violationsA !== violationsB) return violationsA - violationsB;
    if (a.stabilityIndex !== b.stabilityIndex) return b.stabilityIndex - a.stabilityIndex;
    return a.expectedBudget - b.expectedBudget;
  })[0];
}

function countViolations(result: ScenarioCalculationResult): number {
  const constraints = result.constraints;
  return [
    constraints.budgetOk,
    constraints.deadlineOk,
    constraints.stabilityOk,
    constraints.assignmentRiskOk,
  ].filter(ok => !ok).length;
}
