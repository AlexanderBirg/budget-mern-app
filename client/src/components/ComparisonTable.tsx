import type { ComparisonResult, ConstraintDiagnostic } from '../types/domain';

function money(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₽';
}

function num(value: number, digits = 2): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(value);
}

function riskLabel(riskIndex: number): string {
  if (riskIndex <= 0.25) return 'низкий';
  if (riskIndex <= 0.5) return 'средний';
  return 'высокий';
}

function diagnosticValue(item: ConstraintDiagnostic): string {
  if (item.unit === 'rub') return money(item.actual);
  if (item.unit === 'days') return `${num(item.actual)} дн.`;
  if (item.unit === 'index') return num(item.actual, 4);
  return String(item.actual);
}

interface Props {
  result: ComparisonResult;
}

// Таблица сравнения — главный экран приложения, потому что именно здесь виден управленческий вывод.
// В правой колонке выводится диагностика: не просто «не проходит», а конкретно какое ограничение нарушено.
export function ComparisonTable({ result }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Сценарий</th>
            <th className="px-4 py-3">Бюджет</th>
            <th className="px-4 py-3">Срок + δ</th>
            <th className="px-4 py-3">Устойчивость</th>
            <th className="px-4 py-3">Риск</th>
            <th className="px-4 py-3">Статус</th>
            <th className="px-4 py-3">Диагностика ограничений</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {result.results.map(item => {
            const isRecommended = result.recommendedScenarioId === item.scenarioId;
            const diagnostics = item.constraints.diagnostics || [];

            return (
              <tr key={item.scenarioId} className={isRecommended ? 'bg-emerald-50 align-top' : 'align-top'}>
                <td className="px-4 py-3 font-medium text-slate-900">{item.scenarioName}</td>
                <td className="px-4 py-3 whitespace-nowrap">{money(item.expectedBudget)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{num(item.maxDays)} дн.</td>
                <td className="px-4 py-3 whitespace-nowrap">{num(item.stabilityIndex, 4)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{riskLabel(item.riskIndex)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {isRecommended ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">рекомендован</span>
                  ) : item.constraints.isFeasible ? (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">допустим</span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">не проходит</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {diagnostics.length > 0 ? (
                    <div className="space-y-2">
                      {diagnostics.map(diagnostic => (
                        <div key={diagnostic.code} className="flex gap-2 leading-snug">
                          <span className={diagnostic.ok ? 'text-emerald-700' : 'text-red-700'}>
                            {diagnostic.ok ? '✓' : '×'}
                          </span>
                          <div>
                            <div className="font-medium text-slate-800">
                              {diagnostic.label}: {diagnosticValue(diagnostic)}
                            </div>
                            <div className={diagnostic.ok ? 'text-slate-500' : 'text-red-700'}>
                              {diagnostic.message}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : item.constraints.reasons.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-4 text-red-700">
                      {item.constraints.reasons.map(reason => <li key={reason}>{reason}</li>)}
                    </ul>
                  ) : (
                    <span className="text-slate-500">Все ограничения выполнены.</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
