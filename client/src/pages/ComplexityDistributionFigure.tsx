import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type ComplexityRow = {
  level: string;
  tasks: number;
  hours: number;
  description: string;
};

const complexityData: ComplexityRow[] = [
  {
    level: 'L1',
    tasks: 0,
    hours: 0,
    description: 'простые типовые задачи',
  },
  {
    level: 'L2',
    tasks: 6,
    hours: 180,
    description: 'стандартные задачи',
  },
  {
    level: 'L3',
    tasks: 13,
    hours: 628,
    description: 'задачи повышенной сложности',
  },
  {
    level: 'L4',
    tasks: 3,
    hours: 192,
    description: 'критические задачи',
  },
];

const colors = {
  L1: '#cbd5e1',
  L2: '#2563eb',
  L3: '#7c3aed',
  L4: '#dc2626',
};

function formatHours(value: number) {
  return `${new Intl.NumberFormat('ru-RU').format(value)} ч`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const row = payload[0].payload as ComplexityRow;

  return (
    <div className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-lg">
      <div className="font-bold text-slate-950">{label}</div>
      <div className="mt-1 text-slate-600">{row.description}</div>
      <div className="mt-2 font-semibold text-slate-900">
        {row.tasks} задач, {formatHours(row.hours)}
      </div>
    </div>
  );
}

export default function ComplexityDistributionFigure() {
  const totalTasks = complexityData.reduce((sum, row) => sum + row.tasks, 0);
  const totalHours = complexityData.reduce((sum, row) => sum + row.hours, 0);

  return (
    <main className="min-h-screen bg-white p-8 text-slate-950">
      <section className="mx-auto max-w-[1180px] rounded-2xl border border-slate-300 bg-white p-8">
        <header className="mb-8 flex items-end justify-between gap-8 border-b border-slate-300 pb-5">
          <div>
            <div className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
              Уровни сложности задач
            </div>

            <h1 className="text-4xl font-bold tracking-tight">
              Распределение задач по сложности
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-3 text-right">
            <div className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-4">
              <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                Задач
              </div>
              <div className="mt-1 text-3xl font-bold">{totalTasks}</div>
            </div>

            <div className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-4">
              <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                Трудоемкость
              </div>
              <div className="mt-1 text-3xl font-bold">
                {formatHours(totalHours)}
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-300 p-5">
            <h2 className="mb-5 text-2xl font-bold">
              Количество задач
            </h2>

            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={complexityData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="level"
                    tick={{ fontSize: 18, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 14 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="tasks"
                    radius={[10, 10, 0, 0]}
                    label={{
                      position: 'top',
                      fontSize: 20,
                      fontWeight: 700,
                      fill: '#0f172a',
                    }}
                  >
                    {complexityData.map((entry) => (
                      <Cell
                        key={entry.level}
                        fill={colors[entry.level as keyof typeof colors]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-300 p-5">
            <h2 className="mb-5 text-2xl font-bold">
              Базовая трудоемкость
            </h2>

            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={complexityData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="level"
                    tick={{ fontSize: 18, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 14 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="hours"
                    radius={[10, 10, 0, 0]}
                    label={{
                      position: 'top',
                      fontSize: 20,
                      fontWeight: 700,
                      fill: '#0f172a',
                      formatter: (value: number) => value,
                    }}
                  >
                    {complexityData.map((entry) => (
                      <Cell
                        key={entry.level}
                        fill={colors[entry.level as keyof typeof colors]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <section className="mt-7 grid gap-3 md:grid-cols-4">
          {complexityData.map((row) => (
            <div
              key={row.level}
              className="rounded-xl border border-slate-300 bg-slate-50 p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-5 w-5 rounded"
                  style={{
                    backgroundColor: colors[row.level as keyof typeof colors],
                  }}
                />

                <div className="text-2xl font-bold">{row.level}</div>
              </div>

              <div className="mt-3 text-base font-semibold text-slate-900">
                {row.description}
              </div>

              <div className="mt-2 text-sm text-slate-600">
                {row.tasks} задач · {formatHours(row.hours)}
              </div>
            </div>
          ))}
        </section>

        <footer className="mt-7 border-t border-slate-300 pt-5 text-center text-base text-slate-500">
          Рисунок N – Распределение задач расчетного проекта по уровням сложности
        </footer>
      </section>
    </main>
  );
}
