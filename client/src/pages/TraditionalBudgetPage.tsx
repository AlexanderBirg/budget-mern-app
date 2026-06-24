import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

type BudgetRow = {
  id: number;
  role: string;
  shortRole: string;
  hours: number;
  rate: number;
  cost: number;
};

const budgetRows: BudgetRow[] = [
  {
    id: 1,
    role: 'Аналитик',
    shortRole: 'Аналитика',
    hours: 120,
    rate: 1200,
    cost: 144000,
  },
  {
    id: 2,
    role: 'UI/UX-дизайнер',
    shortRole: 'UI/UX',
    hours: 116,
    rate: 1200,
    cost: 139200,
  },
  {
    id: 3,
    role: 'Frontend-разработчик',
    shortRole: 'Frontend',
    hours: 136,
    rate: 1300,
    cost: 176800,
  },
  {
    id: 4,
    role: 'Backend-разработчик',
    shortRole: 'Backend',
    hours: 332,
    rate: 1600,
    cost: 531200,
  },
  {
    id: 5,
    role: 'Интеграционный разработчик',
    shortRole: 'Интеграция',
    hours: 136,
    rate: 1800,
    cost: 244800,
  },
  {
    id: 6,
    role: 'QA-инженер',
    shortRole: 'QA',
    hours: 128,
    rate: 1200,
    cost: 153600,
  },
  {
    id: 7,
    role: 'DevOps-инженер',
    shortRole: 'DevOps',
    hours: 32,
    rate: 2000,
    cost: 64000,
  },
];

const reserveRate = 0.15;
const budgetLimit = 2400000;

const colors = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#7c3aed',
  '#ea580c',
  '#0891b2',
  '#ca8a04',
];

const subtotal = budgetRows.reduce((sum, row) => sum + row.cost, 0);
const totalHours = budgetRows.reduce((sum, row) => sum + row.hours, 0);
const reserve = subtotal * reserveRate;
const total = subtotal + reserve;
const budgetReserve = budgetLimit - total;

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₽';
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function formatPercent(value: number) {
  return value.toFixed(1).replace('.', ',') + '%';
}

function renderCustomizedLabel(props: any) {
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    payload,
  } = props;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.52;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.045) {
    return null;
  }

  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={17}
        fill="#ffffff"
        stroke="#0f172a"
        strokeWidth={2}
      />

      <text
        x={x}
        y={y}
        fill="#0f172a"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[18px] font-bold"
      >
        {payload.id}
      </text>
    </g>
  );
}

export default function TraditionalBudgetPage() {
  const chartData = budgetRows.map((row) => ({
    ...row,
    share: (row.cost / subtotal) * 100,
  }));

  return (
    <main className="min-h-screen bg-white p-6 text-slate-950 lg:p-10">
      <section className="mx-auto max-w-[1280px] rounded-2xl border border-slate-300 bg-white p-8">
        <div className="grid gap-10 lg:grid-cols-[500px_1fr] lg:items-center">
          <section className="relative h-[500px] bg-white p-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="cost"
                  nameKey="role"
                  cx="50%"
                  cy="50%"
                  innerRadius={112}
                  outerRadius={205}
                  paddingAngle={2}
                  labelLine={false}
                  label={renderCustomizedLabel}
                  stroke="#ffffff"
                  strokeWidth={4}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.role}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatMoney(Number(value)),
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '16px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                Без резерва
              </div>

              <div className="mt-2 text-3xl font-bold">
                {formatMoney(subtotal)}
              </div>

              <div className="mt-1 text-base text-slate-500">
                {formatNumber(totalHours)} ч
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5 grid grid-cols-[64px_1fr_150px_90px] gap-4 border-b border-slate-300 pb-3 text-base font-bold text-slate-500">
              <div>№</div>
              <div>Роль</div>
              <div className="text-right">Стоимость</div>
              <div className="text-right">Доля</div>
            </div>

            <div className="space-y-3">
              {chartData.map((row, index) => (
                <div
                  key={row.role}
                  className="grid grid-cols-[64px_1fr_150px_90px] items-center gap-4 rounded-xl border border-slate-300 bg-white p-2"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-900 text-lg font-bold text-white"
                    style={{
                      backgroundColor: colors[index],
                    }}
                  >
                    {row.id}
                  </div>

                  <div>
                    <div className="text-xl font-bold leading-tight">
                      {row.shortRole}
                    </div>

                    <div className="mt-1 text-base text-slate-500">
                      {formatNumber(row.hours)} ч × {formatMoney(row.rate)}
                    </div>
                  </div>

                  <div className="text-right text-xl font-bold">
                    {formatMoney(row.cost)}
                  </div>

                  <div className="text-right text-xl font-bold">
                    {formatPercent(row.share)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-2">
                <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                  База
                </div>
                <div className="mt-1 text-2xl font-bold">
                  {formatMoney(subtotal)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-300 bg-slate-50 p-2">
                <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Резерв
                </div>
                <div className="mt-1 text-2xl font-bold">
                  {formatMoney(reserve)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-300 bg-slate-50 p-2">
                <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Лимит
                </div>
                <div className="mt-1 text-2xl font-bold">
                  {formatMoney(budgetLimit)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-900 bg-slate-900 p-2 text-white">
                <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-300">
                  Итого
                </div>
                <div className="mt-1 text-2xl font-bold">
                  {formatMoney(total)}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-300 bg-white p-2 text-right">
              <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                Запас относительно лимита
              </div>
              <div className="mt-1 text-3xl font-bold text-slate-950">
                {formatMoney(budgetReserve)}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}