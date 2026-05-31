import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ComparisonResult } from '../types/domain';

interface Props {
  result: ComparisonResult;
}

// Небольшой график нужен не для красоты, а для наглядного сравнения сценариев в дипломе.
export function BudgetChart({ result }: Props) {
  const data = result.results.map(item => ({
    name: item.scenarioName.replace(' — ', '\n'),
    budget: Math.round(item.expectedBudget),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => `${Number(value).toLocaleString('ru-RU')} ₽`} />
          <Bar dataKey="budget" name="Бюджет" fill="#334155" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
