type MatrixCell = {
  grade: string;
  level: string;
  value: number;
};

type ScenarioQ = {
  name: string;
  shortName: string;
  value: number;
};

const grades = [
  { key: 'G1', label: 'G1 Intern' },
  { key: 'G2', label: 'G2 Junior' },
  { key: 'G3', label: 'G3 Middle' },
  { key: 'G4', label: 'G4 Senior' },
];

const levels = ['L1', 'L2', 'L3', 'L4'];

const probabilityMatrix: MatrixCell[] = [
  { grade: 'G1', level: 'L1', value: 0.8 },
  { grade: 'G1', level: 'L2', value: 0.4 },
  { grade: 'G1', level: 'L3', value: 0.2 },
  { grade: 'G1', level: 'L4', value: 0.02 },

  { grade: 'G2', level: 'L1', value: 0.9 },
  { grade: 'G2', level: 'L2', value: 0.7 },
  { grade: 'G2', level: 'L3', value: 0.35 },
  { grade: 'G2', level: 'L4', value: 0.15 },

  { grade: 'G3', level: 'L1', value: 0.97 },
  { grade: 'G3', level: 'L2', value: 0.9 },
  { grade: 'G3', level: 'L3', value: 0.8 },
  { grade: 'G3', level: 'L4', value: 0.7 },

  { grade: 'G4', level: 'L1', value: 0.99 },
  { grade: 'G4', level: 'L2', value: 0.97 },
  { grade: 'G4', level: 'L3', value: 0.9 },
  { grade: 'G4', level: 'L4', value: 0.85 },
];

const uncertaintyMatrix: MatrixCell[] = [
  { grade: 'G1', level: 'L1', value: 3 },
  { grade: 'G1', level: 'L2', value: 4 },
  { grade: 'G1', level: 'L3', value: 8 },
  { grade: 'G1', level: 'L4', value: 12 },

  { grade: 'G2', level: 'L1', value: 2 },
  { grade: 'G2', level: 'L2', value: 3 },
  { grade: 'G2', level: 'L3', value: 6 },
  { grade: 'G2', level: 'L4', value: 8 },

  { grade: 'G3', level: 'L1', value: 1 },
  { grade: 'G3', level: 'L2', value: 2 },
  { grade: 'G3', level: 'L3', value: 3 },
  { grade: 'G3', level: 'L4', value: 3 },

  { grade: 'G4', level: 'L1', value: 1 },
  { grade: 'G4', level: 'L2', value: 1 },
  { grade: 'G4', level: 'L3', value: 2 },
  { grade: 'G4', level: 'L4', value: 2 },
];

const scenarioQ: ScenarioQ[] = [
  {
    name: 'A - экономичный',
    shortName: 'A',
    value: 0.78,
  },
  {
    name: 'B - сбалансированный',
    shortName: 'B',
    value: 0.88,
  },
  {
    name: 'C - усиленный',
    shortName: 'C',
    value: 0.94,
  },
];

function getCellValue(matrix: MatrixCell[], grade: string, level: string) {
  return matrix.find((item) => item.grade === grade && item.level === level)
    ?.value;
}

function probabilityColor(value: number) {
  if (value >= 0.85) return 'bg-emerald-600 text-white';
  if (value >= 0.65) return 'bg-emerald-300 text-slate-950';
  if (value >= 0.3) return 'bg-amber-300 text-slate-950';
  if (value >= 0.1) return 'bg-orange-400 text-slate-950';
  return 'bg-red-600 text-white';
}

function uncertaintyColor(value: number) {
  if (value <= 2) return 'bg-emerald-600 text-white';
  if (value <= 5) return 'bg-emerald-300 text-slate-950';
  if (value <= 8) return 'bg-amber-300 text-slate-950';
  if (value <= 14) return 'bg-orange-400 text-slate-950';
  return 'bg-red-600 text-white';
}

function qsColor(value: number) {
  if (value >= 0.9) return 'bg-emerald-600';
  if (value >= 0.8) return 'bg-blue-600';
  if (value >= 0.7) return 'bg-amber-500';
  return 'bg-red-600';
}

function formatProbability(value: number) {
  return value.toFixed(2).replace('.', ',');
}

function formatDelta(value: number) {
  return `${value} дн.`;
}

function formatQ(value: number) {
  return value.toFixed(2).replace('.', ',');
}

function MatrixBlock({
  title,
  subtitle,
  matrix,
  type,
}: {
  title: string;
  subtitle: string;
  matrix: MatrixCell[];
  type: 'probability' | 'uncertainty';
}) {
  return (
    <section className="rounded-2xl border border-slate-300 bg-white p-6">
      <header className="mb-5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          {title}
        </h2>
        <div className="mt-1 text-base text-slate-500">{subtitle}</div>
      </header>

      <div className="grid grid-cols-[150px_repeat(4,1fr)] gap-2">
        <div />
        {levels.map((level) => (
          <div
            key={level}
            className="rounded-lg border border-slate-300 bg-slate-100 py-3 text-center text-xl font-bold"
          >
            {level}
          </div>
        ))}

        {grades.map((grade) => (
          <>
            <div
              key={`${grade.key}-label`}
              className="flex items-center rounded-lg border border-slate-300 bg-slate-50 px-4 text-base font-bold"
            >
              {grade.label}
            </div>

            {levels.map((level) => {
              const value = getCellValue(matrix, grade.key, level) ?? 0;

              const colorClass =
                type === 'probability'
                  ? probabilityColor(value)
                  : uncertaintyColor(value);

              return (
                <div
                  key={`${grade.key}-${level}`}
                  className={`flex min-h-[74px] items-center justify-center rounded-lg text-2xl font-bold ${colorClass}`}
                >
                  {type === 'probability'
                    ? formatProbability(value)
                    : formatDelta(value)}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </section>
  );
}

export default function ModelParametersFigure() {
  return (
    <main className="min-h-screen bg-white p-8 text-slate-950">
      <section className="mx-auto max-w-[1360px] rounded-2xl border border-slate-300 bg-white p-8">
        <header className="mb-8 border-b border-slate-300 pb-6">
          <div className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
            Параметры сценарной модели
          </div>

          <h1 className="text-4xl font-bold tracking-tight">
            Матрицы p(g,l), δ(g,l) и коэффициент qₛ
          </h1>
        </header>

        <div className="grid gap-6">
            <MatrixBlock
              title="Матрица вероятностей p(g,l)"
              subtitle="Вероятность выполнения задачи в ожидаемых трудозатратах"
              matrix={probabilityMatrix}
              type="probability"
            />

            <MatrixBlock
              title="Матрица неопределенности δ(g,l)"
              subtitle="Дополнительная календарная неопределенность, дней"
              matrix={uncertaintyMatrix}
              type="uncertainty"
            />

          <section className="rounded-2xl border border-slate-300 bg-white p-6">
            <header className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                Коэффициент командной слаженности qₛ
              </h2>
              <div className="mt-1 text-base text-slate-500">
                Чем выше значение, тем выше слаженность команды
              </div>
            </header>

            <div className="grid gap-5 lg:grid-cols-3">
              {scenarioQ.map((scenario) => (
                <div
                  key={scenario.shortName}
                  className="rounded-2xl border border-slate-300 bg-slate-50 p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xl font-bold text-slate-950">
                        {scenario.name}
                      </div>
                    </div>

                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold text-white ${qsColor(
                        scenario.value,
                      )}`}
                    >
                      {scenario.shortName}
                    </div>
                  </div>

                  <div className="mb-3 flex items-end justify-between">
                    <div className="text-base font-semibold text-slate-500">
                      qₛ
                    </div>
                    <div className="text-4xl font-bold text-slate-950">
                      {formatQ(scenario.value)}
                    </div>
                  </div>

                  <div className="h-5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${qsColor(
                        scenario.value,
                      )}`}
                      style={{ width: `${scenario.value * 100}%` }}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-4 text-xs font-semibold text-slate-500">
                    <span>0</span>
                    <span className="text-center">0,7</span>
                    <span className="text-center">0,8</span>
                    <span className="text-right">1,0</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
