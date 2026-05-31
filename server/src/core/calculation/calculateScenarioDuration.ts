import type { ProjectTask, ScenarioAssignment } from '../types/domain.js';
import type { TaskCalculationResult, TaskScheduleItem } from '../types/result.js';
import { CalculationError } from '../types/errors.js';

interface ScheduleNode {
  task: ProjectTask;
  result: TaskCalculationResult;
  assignment: ScenarioAssignment;
  durationDays: number;
  startDay: number;
  endDay: number;
}

// Календарная модель на основе графа зависимостей задач.
// Если у задачи нет зависимостей, она может стартовать в день 0.
// Если зависимости есть, задача стартует после завершения самой поздней задачи-предшественника.
export function calculateScenarioDuration(
  tasks: ProjectTask[],
  taskResults: TaskCalculationResult[],
  assignments: ScenarioAssignment[],
  workHoursPerDay: number
): { schedule: TaskScheduleItem[]; expectedCalendarDays: number } {
  const nodes = tasks
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(task => {
      const result = taskResults.find(item => item.taskId === task.id);
      const assignment = assignments.find(item => item.taskId === task.id);

      if (!result || !assignment) {
        throw new CalculationError(
          'INVALID_SCHEDULE_INPUT',
          `Для задачи ${task.id} не найден результат расчета или назначение`,
          { taskId: task.id }
        );
      }

      const allocation = Math.max(assignment.allocation || 1, 0.01);
      const durationDays = result.expectedHours / Math.max(workHoursPerDay * allocation, 0.01);

      return {
        task,
        result,
        assignment,
        durationDays,
        startDay: 0,
        endDay: 0,
      } satisfies ScheduleNode;
    });

  const nodeByTaskId = new Map(nodes.map(node => [node.task.id, node]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function calculateNode(taskId: string): ScheduleNode {
    const node = nodeByTaskId.get(taskId);

    if (!node) {
      throw new CalculationError(
        'TASK_NOT_FOUND',
        `В зависимостях указана несуществующая задача: ${taskId}`,
        { taskId }
      );
    }

    if (visited.has(taskId)) return node;

    if (visiting.has(taskId)) {
      throw new CalculationError(
        'CYCLIC_TASK_DEPENDENCY',
        'В зависимостях задач обнаружен цикл. Расписание невозможно построить.',
        { taskId }
      );
    }

    visiting.add(taskId);

    const dependencyEndDays = node.task.dependsOnTaskIds.map(dependencyTaskId => {
      const dependencyNode = calculateNode(dependencyTaskId);
      return dependencyNode.endDay;
    });

    node.startDay = dependencyEndDays.length > 0 ? Math.max(...dependencyEndDays) : 0;
    node.endDay = node.startDay + node.durationDays;

    visiting.delete(taskId);
    visited.add(taskId);

    return node;
  }

  nodes.forEach(node => calculateNode(node.task.id));

  const schedule = nodes
    .map(node => ({
      taskId: node.task.id,
      taskName: node.task.name,
      stage: node.task.stage,
      employeeId: node.result.employeeId,
      employeeName: node.result.employeeName,
      startDay: round(node.startDay),
      endDay: round(node.endDay),
      durationDays: round(node.durationDays),
      dependsOnTaskIds: node.task.dependsOnTaskIds,
      isCritical: node.task.isCritical,
    }))
    .sort((a, b) => a.startDay - b.startDay || a.endDay - b.endDay);

  const expectedCalendarDays = schedule.length > 0
    ? Math.max(...schedule.map(item => item.endDay))
    : 0;

  return {
    schedule,
    expectedCalendarDays: round(expectedCalendarDays),
  };
}

function round(value: number, precision = 2): number {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}
