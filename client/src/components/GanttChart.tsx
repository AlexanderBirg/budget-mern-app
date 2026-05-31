import type { ScenarioCalculationResult } from '../types/domain';

interface Props {
  result: ScenarioCalculationResult;
}

function round(value: number): string {
  return String(Math.round(value * 10) / 10);
}

// Простая диаграмма Ганта без внешних библиотек.
// Она строится по расписанию, которое возвращает расчетное ядро для конкретного сценария.
export function GanttChart({ result }: Props) {
  const maxDay = Math.max(1, ...result.schedule.map(item => item.endDay));

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Диаграмма Ганта: {result.scenarioName}</h3>
          <p className="mt-1 text-xs text-slate-500">
            Расписание построено по зависимостям задач. Задачи без общих зависимостей могут начинаться параллельно.
          </p>
        </div>
        <div className="text-xs text-slate-500">Расчетный срок: {round(result.expectedCalendarDays)} дн.</div>
      </div>

      <div className="space-y-2">
        {result.schedule.map(item => {
          const left = (item.startDay / maxDay) * 100;
          const width = Math.max((item.durationDays / maxDay) * 100, 2);

          return (
            <div key={item.taskId} className="grid grid-cols-[220px_1fr] items-center gap-3 text-xs">
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-800">{item.taskName}</div>
                <div className="truncate text-slate-500">{item.employeeName} · {item.stage}</div>
              </div>

              <div className="relative h-8 rounded-md border border-slate-200 bg-slate-50">
                <div
                  className="absolute top-1 h-6 rounded bg-slate-700 px-2 text-[11px] leading-6 text-white"
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${item.taskName}: ${round(item.startDay)}–${round(item.endDay)} день`}
                >
                  <span className="whitespace-nowrap">{round(item.startDay)}–{round(item.endDay)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
        <span>0 день</span>
        <span>{round(maxDay)} день</span>
      </div>
    </div>
  );
}
