import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Calculator, GitBranch, GripVertical, Plus, RotateCcw, Save, Sparkles, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import { BudgetChart } from '../components/BudgetChart';
import { ComparisonTable } from '../components/ComparisonTable';
import { GanttChart } from '../components/GanttChart';
import { Section } from '../components/Section';
import { StatCard } from '../components/StatCard';
import type { ComparisonResult, ComplexityLevel, Employee, GradeCode, MatrixCell, ProjectStage, ProjectTask, Scenario, ScenarioAssignment, Workspace } from '../types/domain';

interface Props {
  projectId: string;
  onBack: () => void;
}

const stages: ProjectStage[] = ['analytics', 'design', 'frontend', 'backend', 'integration', 'qa', 'deployment'];
const complexities: ComplexityLevel[] = ['L1', 'L2', 'L3', 'L4'];
const grades: GradeCode[] = ['intern', 'junior', 'middle', 'senior'];

const stageRoleMap: Record<ProjectStage, string[]> = {
  analytics: ['analytics', 'analyst'],
  design: ['design', 'designer'],
  frontend: ['frontend'],
  backend: ['backend'],
  integration: ['integration', 'backend'],
  qa: ['qa', 'test', 'tester'],
  deployment: ['deployment', 'devops'],
};

function normalizeRole(role: string): string {
  return role.trim().toLowerCase();
}

// Исполнитель подбирается по этапу задачи.
// Например, для аналитики показываем только аналитиков, для QA — только тестировщиков.
function getAllowedEmployeesForTask(task: ProjectTask, employees: Employee[]): Employee[] {
  const allowedRoles = stageRoleMap[task.stage] || [];
  return employees.filter(employee => allowedRoles.includes(normalizeRole(employee.role)));
}

function getRoleHint(stage: ProjectStage): string {
  return (stageRoleMap[stage] || []).join(', ');
}

function money(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₽';
}

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Рабочая область проекта: здесь пользователь редактирует входные данные и запускает расчет.
export function WorkspacePage({ projectId, onBack }: Props) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationNote, setOptimizationNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  async function loadWorkspace() {
    setError(null);
    const data = await api.getWorkspace(projectId);
    setWorkspace(data);
    setResult(data.lastResult);
    setSelectedScenarioId(current => data.scenarios.some(scenario => scenario.id === current) ? current : data.scenarios[0]?.id || null);
  }

  useEffect(() => {
    loadWorkspace()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  const selectedScenario = useMemo(() => {
    return workspace?.scenarios.find(scenario => scenario.id === selectedScenarioId) || workspace?.scenarios[0] || null;
  }, [workspace, selectedScenarioId]);

  const recommendedName = useMemo(() => {
    if (!result?.recommendedScenarioId) return 'нет';
    return result.results.find(item => item.scenarioId === result.recommendedScenarioId)?.scenarioName || 'нет';
  }, [result]);

  async function mutate(action: () => Promise<unknown>) {
    setSaving(true);
    setError(null);

    try {
      await action();
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }



  async function handleOptimize() {
    setOptimizing(true);
    setError(null);
    setOptimizationNote(null);

    try {
      const response = await api.optimizeProject(projectId, {
        populationSize: 48,
        generations: 70,
        mutationRate: 0.14,
        teamFitCoefficient: 0.88,
        deltaMode: 'criticalOnly',
      });

      setResult(response.comparison);
      setSelectedScenarioId(response.scenario.id);
      setOptimizationNote(
        `Создан сценарий «${response.scenario.name}». Проверено вариантов: ${response.optimization.evaluatedVariants}. Лучший результат: ${response.optimization.feasibleFound ? 'допустимый сценарий найден' : 'найдена ближайшая альтернатива'}.`
      );
      await loadWorkspace();
      setSelectedScenarioId(response.scenario.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка автоподбора сценария');
    } finally {
      setOptimizing(false);
    }
  }

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

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={handleOptimize}
            disabled={optimizing || calculating || saving}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles size={18} />
            {optimizing ? 'Подбор...' : 'Автоподбор сценария'}
          </button>

          <button
            onClick={handleCalculate}
            disabled={calculating || optimizing || saving}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Calculator size={18} />
            {calculating ? 'Расчет...' : 'Рассчитать сценарии'}
          </button>
        </div>
      </div>

      {error && <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {saving && <div className="mb-6 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Сохранение изменений...</div>}
      {optimizing && <div className="mb-6 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Генетический алгоритм подбирает сценарий назначений...</div>}
      {optimizationNote && <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{optimizationNote}</div>}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard title="Лимит бюджета" value={money(workspace.project.budgetLimit)} />
        <StatCard title="Дедлайн" value={`${workspace.project.deadlineDays} дней`} />
        <StatCard title="Мин. устойчивость" value={workspace.project.minStabilityIndex} />
        <StatCard title="Рекомендация" value={recommendedName} note={result ? 'по последнему расчету' : 'расчет еще не выполнен'} />
      </div>

      <div className="space-y-6">
        <ProjectEditor workspace={workspace} onSave={(data) => mutate(() => api.updateProject(projectId, data))} />

        <TasksEditor workspace={workspace} onMutate={mutate} />


        <MatrixEditor workspace={workspace} onSave={(cells) => mutate(() => api.updateMatrix(cells))} />


        <OptimizationInfo />

        <ScenariosEditor
          workspace={workspace}
          selectedScenario={selectedScenario}
          selectedScenarioId={selectedScenarioId}
          onSelect={setSelectedScenarioId}
          onMutate={mutate}
        />

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
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Диаграммы Ганта по сценариям</h2>
                  <p className="mt-1 text-sm text-slate-500">Диаграммы показывают различия сценариев по календарному расписанию, зависимостям и длительности задач.</p>
                </div>
                {result.results.map(item => <GanttChart key={item.scenarioId} result={item} />)}
              </div>
            </div>
          )}
        </Section>
      </div>
    </main>
  );
}

function ProjectEditor({ workspace, onSave }: { workspace: Workspace; onSave: (data: Partial<Workspace['project']>) => void }) {
  const [draft, setDraft] = useState(workspace.project);

  useEffect(() => setDraft(workspace.project), [workspace.project]);

  return (
    <Section title="Параметры проекта" description="Эти значения задают ограничения, по которым затем проверяются сценарии.">
      <div className="grid gap-4 md:grid-cols-2">
        <LabeledInput label="Название проекта" value={draft.name} onChange={value => setDraft({ ...draft, name: value })} />
        <LabeledInput label="Описание" value={draft.description || ''} onChange={value => setDraft({ ...draft, description: value })} />
        <LabeledInput label="Лимит бюджета, руб." type="number" value={draft.budgetLimit} onChange={value => setDraft({ ...draft, budgetLimit: numberValue(value) })} />
        <LabeledInput label="Дедлайн, дней" type="number" value={draft.deadlineDays} onChange={value => setDraft({ ...draft, deadlineDays: numberValue(value) })} />
        <LabeledInput label="Минимальная устойчивость" type="number" step="0.01" value={draft.minStabilityIndex} onChange={value => setDraft({ ...draft, minStabilityIndex: numberValue(value) })} />
        <LabeledInput label="Минимальная p(g,l)" type="number" step="0.01" value={draft.minAllowedProbability} onChange={value => setDraft({ ...draft, minAllowedProbability: numberValue(value) })} />
      </div>
      <button onClick={() => onSave(draft)} className="mt-4 inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700">
        <Save size={16} /> Сохранить параметры проекта
      </button>
    </Section>
  );
}

function TasksEditor({ workspace, onMutate }: { workspace: Workspace; onMutate: (action: () => Promise<unknown>) => void }) {
  const [drafts, setDrafts] = useState<ProjectTask[]>(workspace.tasks);

  // Задачи редактируются сначала локально, без мгновенной отправки каждой строки на сервер.
  // Это нужно, чтобы пользователь мог спокойно изменить всю таблицу и сохранить ее одной кнопкой.
  useEffect(() => {
    setDrafts(workspace.tasks);
  }, [workspace.tasks]);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [manualColumnCount, setManualColumnCount] = useState(0);

  const orderedTasks = useMemo(() => sortTasksByOrder(drafts), [drafts]);
  const planColumns = useMemo(() => buildPlanColumns(drafts), [drafts]);
  const visiblePlanColumns = useMemo(() => {
    const count = Math.max(planColumns.length, manualColumnCount, 1);
    return Array.from({ length: count }, (_, index) => planColumns[index] || []);
  }, [planColumns, manualColumnCount]);

  useEffect(() => {
    setManualColumnCount(current => Math.max(current, planColumns.length));
  }, [planColumns.length]);

  function updateDraft(id: string, patch: Partial<ProjectTask>) {
    setDrafts(items => items.map(task => task.id === id ? { ...task, ...patch } : task));
  }

  function addDraftTask() {
    setDrafts(items => [
      ...items,
      {
        id: `task-new-${Date.now()}`,
        projectId: workspace.project.id,
        name: 'Новая задача',
        stage: 'analytics',
        baseHours: 8,
        complexityLevel: 'L1',
        isCritical: false,
        order: items.length + 1,
        dependsOnTaskIds: [],
      },
    ]);
  }

  function removeDraftTask(id: string) {
    setDrafts(items => items
      .filter(task => task.id !== id)
      .map((task, index) => ({
        ...task,
        order: index + 1,
        dependsOnTaskIds: (task.dependsOnTaskIds || []).filter(taskId => taskId !== id),
      }))
    );
  }

  function saveTasksGroup() {
    onMutate(() => api.replaceProjectTasks(workspace.project.id, drafts));
  }

  function moveTask(taskId: string, direction: 'up' | 'down') {
    setDrafts(items => {
      const sorted = sortTasksByOrder(items);
      const index = sorted.findIndex(task => task.id === taskId);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return items;

      const next = [...sorted];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

      return next.map((task, orderIndex) => ({ ...task, order: orderIndex + 1 }));
    });
  }


  function addPlanColumn() {
    setManualColumnCount(current => Math.max(current, visiblePlanColumns.length) + 1);
  }

  function removeLastPlanColumn() {
    setManualColumnCount(current => {
      const nextCount = Math.max(1, Math.max(current, visiblePlanColumns.length) - 1);
      const lastColumn = visiblePlanColumns[nextCount];
      if (lastColumn && lastColumn.length > 0) return current;
      return nextCount;
    });
  }

  function moveTaskToColumn(taskId: string, targetColumnIndex: number) {
    setDrafts(items => moveTaskToPlanColumn(items, taskId, targetColumnIndex));
  }

  function applySequentialPlan() {
    setDrafts(items => {
      const sorted = sortTasksByOrder(items);
      return sorted.map((task, index) => ({
        ...task,
        order: index + 1,
        dependsOnTaskIds: index === 0 ? [] : [sorted[index - 1].id],
      }));
    });
  }

  function applyMaxParallelPlan() {
    setDrafts(items => items.map(task => ({ ...task, dependsOnTaskIds: [] })));
  }

  function applyAcademicWebPlan() {
    setDrafts(items => {
      const sorted = sortTasksByOrder(items);
      const byStage = (stage: ProjectStage) => sorted.filter(task => task.stage === stage);
      const lastOf = (stage: ProjectStage) => {
        const stageTasks = byStage(stage);
        return stageTasks[stageTasks.length - 1]?.id;
      };
      const idsOf = (stage: ProjectStage) => byStage(stage).map(task => task.id);

      const analyticsLast = lastOf('analytics');
      const designLast = lastOf('design');
      const developmentIds = [...idsOf('frontend'), ...idsOf('backend'), ...idsOf('integration')];
      const developmentDeps = [designLast || analyticsLast].filter(Boolean) as string[];
      const qaDeps = developmentIds.length > 0 ? developmentIds : [designLast || analyticsLast].filter(Boolean) as string[];
      const qaIds = idsOf('qa');
      const deploymentDeps = qaIds.length > 0 ? qaIds : qaDeps;

      return sorted.map((task, index) => {
        let dependsOnTaskIds: string[] = [];

        if (task.stage === 'analytics') {
          // Если аналитических задач несколько, они идут последовательно в рамках аналитики.
          const previousAnalytics = byStage('analytics').find((item, itemIndex, list) => list[itemIndex + 1]?.id === task.id);
          dependsOnTaskIds = previousAnalytics ? [previousAnalytics.id] : [];
        }

        if (task.stage === 'design') {
          const previousDesign = byStage('design').find((item, itemIndex, list) => list[itemIndex + 1]?.id === task.id);
          dependsOnTaskIds = previousDesign ? [previousDesign.id] : [analyticsLast].filter(Boolean) as string[];
        }

        if (['frontend', 'backend', 'integration'].includes(task.stage)) {
          dependsOnTaskIds = developmentDeps;
        }

        if (task.stage === 'qa') {
          const previousQa = byStage('qa').find((item, itemIndex, list) => list[itemIndex + 1]?.id === task.id);
          dependsOnTaskIds = previousQa ? [previousQa.id] : qaDeps;
        }

        if (task.stage === 'deployment') {
          const previousDeploy = byStage('deployment').find((item, itemIndex, list) => list[itemIndex + 1]?.id === task.id);
          dependsOnTaskIds = previousDeploy ? [previousDeploy.id] : deploymentDeps;
        }

        return { ...task, order: index + 1, dependsOnTaskIds: dependsOnTaskIds.filter(id => id !== task.id) };
      });
    });
  }

  return (
    <Section title="Задачи проекта" description="Задачи являются входом расчетной модели: часы, сложность, критичность и зависимости влияют на бюджет, риск и календарный план.">
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-start gap-2">
          <GitBranch className="mt-0.5 text-slate-500" size={18} />
          <div>
            <h3 className="font-medium text-slate-900">Порядок и параллельность работ</h3>
            <p className="mt-1 text-sm text-slate-600">
              Поле «После каких задач» задает предшественников. Если у двух задач один и тот же предшественник, они могут стартовать параллельно после его завершения. Если предшественников нет, задача может начаться сразу.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={applyAcademicWebPlan} className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700">
            Стандартный ИТ-поток
          </button>
          <button onClick={applySequentialPlan} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-white">
            Все последовательно
          </button>
          <button onClick={applyMaxParallelPlan} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-white">
            Максимум параллельности
          </button>
        </div>
      </div>

      <div className="mb-4 overflow-x-auto rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-medium text-slate-900">Drag-and-drop планировщик зависимостей</h3>
            <p className="text-sm text-slate-500">
              Перетащите задачу в нужный шаг. Задачи в одной колонке считаются параллельными, а задачи следующего шага автоматически зависят от задач предыдущего шага.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={addPlanColumn} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Добавить шаг
            </button>
            <button onClick={removeLastPlanColumn} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Убрать пустой шаг
            </button>
          </div>
        </div>

        <div className="flex min-w-max gap-4">
          {visiblePlanColumns.map((column, index) => (
            <div
              key={index}
              onDragOver={event => event.preventDefault()}
              onDrop={() => {
                if (!draggedTaskId) return;
                moveTaskToColumn(draggedTaskId, index);
                setDraggedTaskId(null);
              }}
              className={`w-72 shrink-0 rounded-md border p-3 transition ${draggedTaskId ? 'border-slate-400 bg-slate-100' : 'border-slate-200 bg-slate-50'}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Шаг {index + 1}</div>
                <div className="text-xs text-slate-400">{column.length} задач</div>
              </div>

              <div className="min-h-24 space-y-2">
                {column.length === 0 && (
                  <div className="rounded-md border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">
                    Перетащите задачу сюда
                  </div>
                )}

                {column.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggedTaskId(task.id)}
                    onDragEnd={() => setDraggedTaskId(null)}
                    className="cursor-grab rounded-md border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-400 active:cursor-grabbing"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 shrink-0 text-slate-400" size={16} />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{task.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{task.stage}, {task.baseHours} ч., {task.complexityLevel}</div>
                        {(task.dependsOnTaskIds || []).length > 0 && (
                          <div className="mt-2 text-xs text-slate-500">
                            После: {(task.dependsOnTaskIds || []).map(id => getTaskName(drafts, id)).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={addDraftTask}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <Plus size={16} /> Добавить задачу
        </button>

        <button
          onClick={saveTasksGroup}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700"
        >
          <Save size={16} /> Сохранить задачи
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2">Порядок</th>
              <th className="py-2">Задача</th>
              <th className="py-2">Этап</th>
              <th className="py-2">Часы</th>
              <th className="py-2">Сложность</th>
              <th className="py-2">Крит.</th>
              <th className="py-2">После каких задач</th>
              <th className="py-2">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orderedTasks.map(task => (
              <tr key={task.id}>
                <td className="py-2">
                  <div className="flex items-center gap-1">
                    <span className="w-7 text-center text-slate-500">{task.order}</span>
                    <IconButton title="Выше" onClick={() => moveTask(task.id, 'up')} icon={<ArrowUp size={14} />} />
                    <IconButton title="Ниже" onClick={() => moveTask(task.id, 'down')} icon={<ArrowDown size={14} />} />
                  </div>
                </td>
                <td className="py-2"><SmallInput value={task.name} onChange={value => updateDraft(task.id, { name: value })} /></td>
                <td className="py-2"><SmallSelect value={task.stage} options={stages} onChange={value => updateDraft(task.id, { stage: value as ProjectStage })} /></td>
                <td className="py-2"><SmallInput type="number" value={task.baseHours} onChange={value => updateDraft(task.id, { baseHours: numberValue(value) })} /></td>
                <td className="py-2"><SmallSelect value={task.complexityLevel} options={complexities} onChange={value => updateDraft(task.id, { complexityLevel: value as ComplexityLevel })} /></td>
                <td className="py-2"><input type="checkbox" checked={task.isCritical} onChange={event => updateDraft(task.id, { isCritical: event.target.checked })} /></td>
                <td className="py-2">
                  <PredecessorPicker
                    task={task}
                    tasks={drafts}
                    onChange={dependsOnTaskIds => updateDraft(task.id, { dependsOnTaskIds })}
                  />
                </td>
                <td className="py-2">
                  <IconButton title="Удалить из списка" onClick={() => removeDraftTask(task.id)} icon={<Trash2 size={15} />} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function MatrixEditor({ workspace, onSave }: { workspace: Workspace; onSave: (cells: MatrixCell[]) => void }) {
  const [cells, setCells] = useState<MatrixCell[]>(workspace.matrix);

  useEffect(() => setCells(workspace.matrix), [workspace.matrix]);

  function getCell(grade: GradeCode, complexityLevel: ComplexityLevel): MatrixCell {
    return cells.find(cell => cell.grade === grade && cell.complexityLevel === complexityLevel) || { grade, complexityLevel, probability: 0, deltaDays: 0 };
  }

  function updateCell(grade: GradeCode, complexityLevel: ComplexityLevel, patch: Partial<MatrixCell>) {
    setCells(current => {
      const exists = current.some(cell => cell.grade === grade && cell.complexityLevel === complexityLevel);
      const nextCell = { ...getCell(grade, complexityLevel), ...patch };
      if (!exists) return [...current, nextCell];
      return current.map(cell => cell.grade === grade && cell.complexityLevel === complexityLevel ? nextCell : cell);
    });
  }

  return (
    <Section title="Матрица модели p(g,l) и δ(g,l)" description="Таблица показывает надежность и календарную неопределенность для каждой пары «грейд — сложность». Значения можно редактировать.">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
              <th className="border border-slate-200 px-3 py-2">Грейд / сложность</th>
              {complexities.map(level => <th key={level} className="border border-slate-200 px-3 py-2 text-center">{level}</th>)}
            </tr>
          </thead>
          <tbody>
            {grades.map(grade => (
              <tr key={grade}>
                <td className="border border-slate-200 px-3 py-2 font-medium text-slate-900">{grade}</td>
                {complexities.map(level => {
                  const cell = getCell(grade, level);
                  return (
                    <td key={level} className="border border-slate-200 px-3 py-2">
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs text-slate-500">p
                          <input className="mt-1 w-full rounded border border-slate-300 px-2 py-1" type="number" step="0.01" min="0" max="1" value={cell.probability} onChange={event => updateCell(grade, level, { probability: numberValue(event.target.value) })} />
                        </label>
                        <label className="text-xs text-slate-500">δ
                          <input className="mt-1 w-full rounded border border-slate-300 px-2 py-1" type="number" min="0" value={cell.deltaDays} onChange={event => updateCell(grade, level, { deltaDays: numberValue(event.target.value) })} />
                        </label>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => onSave(cells)} className="mt-4 inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700">
        <Save size={16} /> Сохранить матрицу
      </button>
    </Section>
  );
}


function OptimizationInfo() {
  return (
    <Section
      title="Автоматический подбор сценария"
      description="Модуль генетического алгоритма формирует дополнительный сценарий назначений и сравнивает его с ручными вариантами."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <div className="font-medium text-slate-900">Что оптимизируется</div>
          <p className="mt-1">Назначения исполнителей на задачи проекта с учетом ролей, бюджета, срока и устойчивости.</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <div className="font-medium text-slate-900">Как работает</div>
          <p className="mt-1">Алгоритм создает популяцию сценариев, скрещивает и мутирует назначения, а затем оценивает варианты через расчетное ядро.</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <div className="font-medium text-slate-900">Результат</div>
          <p className="mt-1">После нажатия «Автоподбор сценария» создается новый сценарий D, который участвует в общей таблице сравнения.</p>
        </div>
      </div>
    </Section>
  );
}

function ScenariosEditor({ workspace, selectedScenario, selectedScenarioId, onSelect, onMutate }: {
  workspace: Workspace;
  selectedScenario: Scenario | null;
  selectedScenarioId: string | null;
  onSelect: (id: string | null) => void;
  onMutate: (action: () => Promise<unknown>) => void;
}) {
  const [draft, setDraft] = useState<Scenario | null>(selectedScenario);
  const [newScenarioName, setNewScenarioName] = useState('Новый сценарий');

  useEffect(() => setDraft(selectedScenario), [selectedScenario]);

  function buildDefaultAssignments(): ScenarioAssignment[] {
    return workspace.tasks
      .map(task => {
        const firstAllowedEmployee = getAllowedEmployeesForTask(task, workspace.employees)[0];
        if (!firstAllowedEmployee) return null;
        return { taskId: task.id, employeeId: firstAllowedEmployee.id, allocation: 1 };
      })
      .filter((assignment): assignment is ScenarioAssignment => Boolean(assignment));
  }

  function updateAssignment(taskId: string, patch: Partial<ScenarioAssignment>) {
    if (!draft) return;

    const exists = draft.assignments.some(assignment => assignment.taskId === taskId);
    const task = workspace.tasks.find(item => item.id === taskId);
    const firstAllowedEmployee = task ? getAllowedEmployeesForTask(task, workspace.employees)[0] : null;

    const nextAssignments = exists
      ? draft.assignments.map(assignment => assignment.taskId === taskId ? { ...assignment, ...patch } : assignment)
      : [...draft.assignments, { taskId, employeeId: firstAllowedEmployee?.id || '', allocation: 1, ...patch }];

    setDraft({ ...draft, assignments: nextAssignments });
  }

  return (
    <Section title="Сценарии команды и назначения" description="Здесь редактируется сам сценарий и его главное содержание: какая задача какому исполнителю назначена.">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={selectedScenarioId || ''} onChange={event => onSelect(event.target.value)}>
          {workspace.scenarios.map(scenario => <option key={scenario.id} value={scenario.id}>{scenario.name}</option>)}
        </select>
        <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={newScenarioName} onChange={event => setNewScenarioName(event.target.value)} />
        <button
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          onClick={() => onMutate(async () => {
            const created = await api.createScenario(workspace.project.id, {
              name: newScenarioName,
              description: 'Сценарий создан через интерфейс',
              teamFitCoefficient: 0.8,
              deltaMode: 'criticalOnly',
              assignments: buildDefaultAssignments(),
            });
            onSelect(created.id);
          })}
        >
          <Plus size={15} /> Создать сценарий
        </button>
      </div>

      {!draft ? (
        <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-slate-500">Сценарии пока не созданы.</div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <LabeledInput label="Название сценария" value={draft.name} onChange={value => setDraft({ ...draft, name: value })} />
            <LabeledInput label="Описание" value={draft.description || ''} onChange={value => setDraft({ ...draft, description: value })} />
            <LabeledInput label="Коэффициент слаженности q_s" type="number" step="0.01" value={draft.teamFitCoefficient} onChange={value => setDraft({ ...draft, teamFitCoefficient: numberValue(value) })} />
            <label className="text-sm font-medium text-slate-700">Режим расчета δ
              <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={draft.deltaMode} onChange={event => setDraft({ ...draft, deltaMode: event.target.value as Scenario['deltaMode'] })}>
                <option value="criticalOnly">только критичные задачи</option>
                <option value="allTasks">все задачи</option>
              </select>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2">Задача</th>
                  <th className="py-2">Сложность</th>
                  <th className="py-2">Исполнитель</th>
                  <th className="py-2">Занятость</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workspace.tasks.map(task => {
                  const assignment = draft.assignments.find(item => item.taskId === task.id);
                  const allowedEmployees = getAllowedEmployeesForTask(task, workspace.employees);
                  const selectedEmployeeAllowed = allowedEmployees.some(employee => employee.id === assignment?.employeeId);

                  return (
                    <tr key={task.id}>
                      <td className="py-2 font-medium text-slate-900">{task.name}</td>
                      <td className="py-2 text-slate-600">{task.complexityLevel}</td>
                      <td className="py-2">
                        <select
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1"
                          value={selectedEmployeeAllowed ? assignment?.employeeId || '' : ''}
                          onChange={event => updateAssignment(task.id, { employeeId: event.target.value })}
                        >
                          <option value="">Не назначено</option>
                          {allowedEmployees.map(employee => <option key={employee.id} value={employee.id}>{employee.name} / {employee.grade} / {money(employee.hourRate)}</option>)}
                        </select>
                        {allowedEmployees.length === 0 && (
                          <p className="mt-1 text-xs text-red-700">Для этапа {task.stage} нет исполнителей с ролью: {getRoleHint(task.stage)}.</p>
                        )}
                        {assignment?.employeeId && !selectedEmployeeAllowed && allowedEmployees.length > 0 && (
                          <p className="mt-1 text-xs text-amber-700">Текущее назначение не соответствует этапу задачи. Выберите исполнителя из допустимого списка.</p>
                        )}
                      </td>
                      <td className="py-2">
                        <SmallInput type="number" step="0.1" value={assignment?.allocation || 1} onChange={value => updateAssignment(task.id, { allocation: numberValue(value) })} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button onClick={() => onMutate(() => api.updateScenario(draft.id, draft))} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700">
              <Save size={16} /> Сохранить сценарий
            </button>
            <button onClick={() => onMutate(() => api.deleteScenario(draft.id))} className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50">
              <Trash2 size={16} /> Удалить сценарий
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}


function sortTasksByOrder(tasks: ProjectTask[]): ProjectTask[] {
  return [...tasks].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

function getTaskName(tasks: ProjectTask[], taskId: string): string {
  return tasks.find(task => task.id === taskId)?.name || 'Задача удалена';
}

function taskDependsOn(tasks: ProjectTask[], startTaskId: string, targetTaskId: string, visited = new Set<string>()): boolean {
  if (visited.has(startTaskId)) return false;
  visited.add(startTaskId);

  const task = tasks.find(item => item.id === startTaskId);
  if (!task) return false;

  const dependencies = task.dependsOnTaskIds || [];
  if (dependencies.includes(targetTaskId)) return true;

  return dependencies.some(dependencyId => taskDependsOn(tasks, dependencyId, targetTaskId, visited));
}

function getAvailablePredecessors(task: ProjectTask, tasks: ProjectTask[]): ProjectTask[] {
  return sortTasksByOrder(tasks).filter(candidate => {
    if (candidate.id === task.id) return false;

    // Запрещаем выбрать предшественником задачу, которая сама зависит от текущей.
    // Это защищает пользователя от циклов вида A после B, а B после A.
    return !taskDependsOn(tasks, candidate.id, task.id);
  });
}

function buildPlanColumns(tasks: ProjectTask[]): ProjectTask[][] {
  const sorted = sortTasksByOrder(tasks);
  const levelByTask = new Map<string, number>();
  const visiting = new Set<string>();

  function getLevel(taskId: string): number {
    if (levelByTask.has(taskId)) return levelByTask.get(taskId) || 0;
    if (visiting.has(taskId)) return 0;

    visiting.add(taskId);
    const task = sorted.find(item => item.id === taskId);
    const dependencies = (task?.dependsOnTaskIds || []).filter(id => sorted.some(item => item.id === id));
    const level = dependencies.length === 0 ? 0 : Math.max(...dependencies.map(getLevel)) + 1;
    visiting.delete(taskId);
    levelByTask.set(taskId, level);
    return level;
  }

  sorted.forEach(task => getLevel(task.id));

  const columns: ProjectTask[][] = [];
  sorted.forEach(task => {
    const level = levelByTask.get(task.id) || 0;
    if (!columns[level]) columns[level] = [];
    columns[level].push(task);
  });

  return columns.length > 0 ? columns : [[]];
}


function moveTaskToPlanColumn(tasks: ProjectTask[], taskId: string, targetColumnIndex: number): ProjectTask[] {
  const sorted = sortTasksByOrder(tasks);
  const columns = buildPlanColumns(sorted).map(column => [...column]);

  while (columns.length <= targetColumnIndex) columns.push([]);

  const movedTask = sorted.find(task => task.id === taskId);
  if (!movedTask) return tasks;

  const nextColumns = columns.map(column => column.filter(task => task.id !== taskId));
  nextColumns[targetColumnIndex] = [...(nextColumns[targetColumnIndex] || []), movedTask];

  // При переносе в колонку задача получает зависимости от задач предыдущей колонки.
  // Так пользователь управляет параллельностью без ручного выбора каждого предшественника.
  const previousColumn = targetColumnIndex > 0 ? nextColumns[targetColumnIndex - 1] || [] : [];
  const safeDependencies = previousColumn
    .filter(task => task.id !== taskId)
    .filter(task => !taskDependsOn(sorted, task.id, taskId))
    .map(task => task.id);

  const flattened = nextColumns.flat();
  const orderById = new Map(flattened.map((task, index) => [task.id, index + 1]));

  return sorted.map(task => {
    if (task.id === taskId) {
      return {
        ...task,
        order: orderById.get(task.id) || task.order,
        dependsOnTaskIds: safeDependencies,
      };
    }

    return {
      ...task,
      order: orderById.get(task.id) || task.order,
    };
  });
}

function PredecessorPicker({ task, tasks, onChange }: { task: ProjectTask; tasks: ProjectTask[]; onChange: (ids: string[]) => void }) {
  const availableTasks = getAvailablePredecessors(task, tasks);
  const selectedIds = (task.dependsOnTaskIds || []).filter(id => tasks.some(item => item.id === id));
  const unselectedTasks = availableTasks.filter(item => !selectedIds.includes(item.id));

  function addDependency(taskId: string) {
    if (!taskId || selectedIds.includes(taskId)) return;
    onChange([...selectedIds, taskId]);
  }

  function removeDependency(taskId: string) {
    onChange(selectedIds.filter(id => id !== taskId));
  }

  function clearDependencies() {
    onChange([]);
  }

  return (
    <div className="min-w-72 space-y-2">
      <select
        value=""
        onChange={event => addDependency(event.target.value)}
        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-slate-500"
      >
        <option value="">Добавить предшественника...</option>
        {unselectedTasks.map(item => (
          <option key={item.id} value={item.id}>{item.order}. {item.name}</option>
        ))}
      </select>

      {selectedIds.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-2 py-2 text-xs text-slate-500">
          Стартует без предшественников
        </div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {selectedIds.map(id => (
            <button
              key={id}
              type="button"
              onClick={() => removeDependency(id)}
              className="rounded-full border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-red-50 hover:text-red-700"
              title="Нажмите, чтобы убрать зависимость"
            >
              после: {getTaskName(tasks, id)} ×
            </button>
          ))}
          <button type="button" onClick={clearDependencies} className="rounded-full px-2 py-1 text-xs text-slate-500 hover:text-slate-900">
            очистить
          </button>
        </div>
      )}
    </div>
  );
}

function LabeledInput({ label, value, onChange, type = 'text', step }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; step?: string }) {
  return (
    <label className="text-sm font-medium text-slate-700">{label}
      <input type={type} step={step} value={value} onChange={event => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
    </label>
  );
}

function SmallInput({ value, onChange, type = 'text', step }: { value: string | number; onChange: (value: string) => void; type?: string; step?: string }) {
  return <input type={type} step={step} value={value} onChange={event => onChange(event.target.value)} className="w-full min-w-24 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-slate-500" />;
}

function SmallSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={event => onChange(event.target.value)} className="w-full min-w-28 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-slate-500">
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function IconButton({ title, icon, onClick }: { title: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick} className="inline-flex items-center justify-center rounded-md border border-slate-300 p-2 text-slate-700 hover:bg-slate-50">
      {icon}
    </button>
  );
}
