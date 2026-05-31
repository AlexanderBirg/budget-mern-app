import type { ProjectStage, ScenarioAssignment } from '../types/domain.js';
import type { StageDurationResult, TaskCalculationResult } from '../types/result.js';

const STAGE_ORDER: ProjectStage[] = [
  'analytics',
  'design',
  'backend',
  'frontend',
  'integration',
  'qa',
  'deployment',
];

// Упрощенная календарная модель MVP:
// analytics -> design -> max(frontend, backend, integration) -> qa -> deployment
const PARALLEL_GROUPS: ProjectStage[][] = [
  ['analytics'],
  ['design'],
  ['frontend', 'backend', 'integration'],
  ['qa'],
  ['deployment'],
];

export function calculateScenarioDuration(
  taskResults: TaskCalculationResult[],
  assignments: ScenarioAssignment[],
  workHoursPerDay: number
): { stageDurations: StageDurationResult[]; expectedCalendarDays: number } {
  const stageDurations = STAGE_ORDER
    .map(stage => {
      const stageTasks = taskResults.filter(result => result.stage === stage);
      const expectedHours = stageTasks.reduce((sum, task) => sum + task.expectedHours, 0);

      const capacityHoursPerDay = stageTasks.reduce((sum, task) => {
        const assignment = assignments.find(item => item.taskId === task.taskId);
        const allocation = assignment?.allocation ?? 1;
        return sum + workHoursPerDay * allocation;
      }, 0);

      const durationDays = expectedHours === 0
        ? 0
        : expectedHours / Math.max(capacityHoursPerDay, 0.01);

      return {
        stage,
        expectedHours: round(expectedHours),
        capacityHoursPerDay: round(capacityHoursPerDay),
        durationDays: round(durationDays),
      };
    })
    .filter(stage => stage.expectedHours > 0);

  const expectedCalendarDays = PARALLEL_GROUPS.reduce((total, group) => {
    const groupDurations = group.map(stage => {
      return stageDurations.find(item => item.stage === stage)?.durationDays ?? 0;
    });

    return total + Math.max(...groupDurations);
  }, 0);

  return {
    stageDurations,
    expectedCalendarDays: round(expectedCalendarDays),
  };
}

function round(value: number, precision = 2): number {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}
