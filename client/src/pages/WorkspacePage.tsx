import { useEffect, useMemo, useState } from 'react';
import { Calculator, Database, RotateCcw } from 'lucide-react';
import { api } from '../api/client';
import { BudgetChart } from '../components/BudgetChart';
import { ComparisonTable } from '../components/ComparisonTable';
import { Section } from '../components/Section';
import { StatCard } from '../components/StatCard';
import type { ComparisonResult, Workspace } from '../types/domain';

interface Props {
  projectId: string;
  onBack: () => void;
}

function money(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₽';
}

// Рабочая область проекта: здесь видны входные данные и результат расчета.
export function WorkspacePage({ projectId, onBack }: Props) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getWorkspace(projectId)
      .then((data) => {
        setWorkspace(data);
        setResult(data.lastResult);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  const recommendedName = useMemo(() => {
    if (!result?.recommendedScenarioId) return 'нет';
    return result.results.find(item => item.scenarioId === result.recommendedScenarioId)?.scenarioName || 'нет';
  }, [result]);

  async function handleCalculate() {
    setCalculating(true);
    setError(null);

    try {
      const calculation = await api.calculateProject(projectId);
      setResult(calculation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка расчета');
    } finally {
      setCalculating(false);
    }
  }

  if (loading) return <div className="p-8 text-slate-600">Загрузка рабочей области...</div>;
  if (!workspace) return <div className="p-8 text-red-700">Проект не найден</div>;

  return (
    <main className="mx-auto max-w-7xl p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <button onClick={onBack} className="mb-4 text-sm text-slate-500 hover:text-slate-900">← К списку проектов</button>
          <p className="text-sm uppercase tracking-wide text-slate-500">Рабочая область проекта</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{workspace.project.name}</h1>
          <p className="mt-2 max-w-4xl text-slate-600">{workspace.project.description}</p>
        </div>

        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Calculator size={18} />
          {calculating ? 'Расчет...' : 'Рассчитать сценарии'}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard title="Лимит бюджета" value={money(workspace.project.budgetLimit)} />
        <StatCard title="Дедлайн" value={`${workspace.project.deadlineDays} дней`} />
        <StatCard title="Мин. устойчивость" value={workspace.project.minStabilityIndex} />
        <StatCard title="Рекомендация" value={recommendedName} note={result ? 'по последнему расчету' : 'расчет еще не выполнен'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Задачи проекта" description="Исходная декомпозиция работ, на основе которой выполняется расчет.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2">Задача</th>
                  <th className="py-2">Этап</th>
                  <th className="py-2">Часы</th>
                  <th className="py-2">Сложность</th>
                  <th className="py-2">Крит.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workspace.tasks.map(task => (
                  <tr key={task.id}>
                    <td className="py-2 font-medium">{task.name}</td>
                    <td className="py-2 text-slate-600">{task.stage}</td>
                    <td className="py-2">{task.baseHours}</td>
                    <td className="py-2">{task.complexityLevel}</td>
                    <td className="py-2">{task.isCritical ? 'да' : 'нет'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Исполнители" description="Ставки и грейды используются для оценки стоимости и надежности назначений.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2">Исполнитель</th>
                  <th className="py-2">Роль</th>
                  <th className="py-2">Грейд</th>
                  <th className="py-2">Ставка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workspace.employees.map(employee => (
                  <tr key={employee.id}>
                    <td className="py-2 font-medium">{employee.name}</td>
                    <td className="py-2 text-slate-600">{employee.role}</td>
                    <td className="py-2">{employee.grade}</td>
                    <td className="py-2">{money(employee.hourRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Сценарии команды" description="Каждый сценарий хранит назначения задач исполнителям.">
          <div className="space-y-4">
            {workspace.scenarios.map(scenario => (
              <div key={scenario.id} className="rounded-md border border-slate-200 p-4">
                <div className="font-medium text-slate-900">{scenario.name}</div>
                <div className="mt-1 text-sm text-slate-500">{scenario.description}</div>
                <div className="mt-2 text-xs text-slate-500">q_s = {scenario.teamFitCoefficient}; режим δ = {scenario.deltaMode}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Матрица модели" description="Фрагмент значений p(g,l) и δ(g,l), загруженных из MongoDB.">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Database size={18} />
            <span>Всего ячеек матрицы: {workspace.matrix.length}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            {workspace.matrix.slice(0, 8).map(cell => (
              <div key={`${cell.grade}-${cell.complexityLevel}`} className="rounded-md border border-slate-200 p-3">
                <div className="font-medium">{cell.grade} / {cell.complexityLevel}</div>
                <div className="mt-1 text-slate-600">p = {cell.probability}; δ = {cell.deltaDays}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="mt-6 space-y-6">
        <Section title="Результаты сравнения" description="Расчет выполняется сервером: Express достает данные из MongoDB и передает их в расчетное ядро.">
          {!result ? (
            <div className="rounded-md border border-dashed border-slate-300 p-8 text-center text-slate-500">
              Нажмите «Рассчитать сценарии», чтобы получить сравнение.
            </div>
          ) : (
            <div className="space-y-6">
              <ComparisonTable result={result} />
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="mb-1 flex items-center gap-2 font-medium text-slate-900"><RotateCcw size={16} /> Управленческий вывод</div>
                {result.recommendedScenarioId ? (
                  <p>Рекомендуемый сценарий: <b>{recommendedName}</b>. Он выбран как минимальный по бюджету среди сценариев, которые проходят ограничения проекта.</p>
                ) : (
                  <p>Полностью допустимый сценарий отсутствует. Необходимо изменить состав команды, бюджет или срок проекта.</p>
                )}
              </div>
              <BudgetChart result={result} />
            </div>
          )}
        </Section>
      </div>
    </main>
  );
}
