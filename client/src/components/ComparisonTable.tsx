import type { ComparisonResult } from '../types/domain';

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

interface Props {
  result: ComparisonResult;
}

// Таблица сравнения — главный экран приложения, потому что именно здесь виден управленческий вывод.
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
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {result.results.map(item => {
            const isRecommended = result.recommendedScenarioId === item.scenarioId;
            return (
              <tr key={item.scenarioId} className={isRecommended ? 'bg-emerald-50' : ''}>
                <td className="px-4 py-3 font-medium text-slate-900">{item.scenarioName}</td>
                <td className="px-4 py-3">{money(item.expectedBudget)}</td>
                <td className="px-4 py-3">{num(item.maxDays)} дн.</td>
                <td className="px-4 py-3">{num(item.stabilityIndex, 4)}</td>
                <td className="px-4 py-3">{riskLabel(item.riskIndex)}</td>
                <td className="px-4 py-3">
                  {isRecommended ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">рекомендован</span>
                  ) : item.constraints.isFeasible ? (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">допустим</span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">не проходит</span>
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
