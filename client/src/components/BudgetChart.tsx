import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ComparisonResult } from '../types/domain';

interface Props {
  result: ComparisonResult;
}

function money(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₽';
}

function shortMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2).replace('.', ',')} млн`;
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)} тыс.`;
  return String(Math.round(value));
}

// График строится с осью от ближайшего минимума, а не строго от нуля.
// Так небольшая разница между сценариями остается видимой, но подпись под графиком честно фиксирует этот прием.
export function BudgetChart({ result }: Props) {
  const budgets = result.results.map(item => Math.round(item.expectedBudget));
  const minBudget = Math.min(...budgets);
  const maxBudget = Math.max(...budgets);
  const spread = Math.max(maxBudget - minBudget, 1);
  const padding = Math.max(spread * 0.35, maxBudget * 0.015);
  const domainMin = Math.max(0, Math.floor((minBudget - padding) / 10_000) * 10_000);
  const domainMax = Math.ceil((maxBudget + padding) / 10_000) * 10_000;

  const data = result.results.map(item => ({
    name: item.scenarioName,
    budget: Math.round(item.expectedBudget),
  }));

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Сравнение бюджета сценариев</h3>
        <p className="mt-1 text-xs text-slate-500">
          Горизонтальная шкала начинается от ближайшего минимального значения, чтобы были заметны небольшие различия между сценариями.
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 72, left: 12, bottom: 12 }}
            barCategoryGap={18}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis
              type="number"
              domain={[domainMin, domainMax]}
              tick={{ fontSize: 12 }}
              tickFormatter={shortMoney}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={170}
              tick={{ fontSize: 12 }}
            />
            <Tooltip formatter={(value) => money(Number(value))} />
            <Bar dataKey="budget" name="Бюджет" fill="#334155" radius={[0, 4, 4, 0]} barSize={20}>
              <LabelList dataKey="budget" position="right" formatter={(value: number) => money(value)} className="text-xs" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
