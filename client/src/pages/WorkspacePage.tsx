import { useEffect, useMemo, useState } from 'react';
import { Calculator, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import { BudgetChart } from '../components/BudgetChart';
import { ComparisonTable } from '../components/ComparisonTable';
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
          disabled={calculating || saving}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Calculator size={18} />
          {calculating ? 'Расчет...' : 'Рассчитать сценарии'}
        </button>
      </div>

      {error && <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {saving && <div className="mb-6 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Сохранение изменений...</div>}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard title="Лимит бюджета" value={money(workspace.project.budgetLimit)} />
        <StatCard title="Дедлайн" value={`${workspace.project.deadlineDays} дней`} />
        <StatCard title="Мин. устойчивость" value={workspace.project.minStabilityIndex} />
        <StatCard title="Рекомендация" value={recommendedName} note={result ? 'по последнему расчету' : 'расчет еще не выполнен'} />
      </div>

      <div className="space-y-6">
        <ProjectEditor workspace={workspace} onSave={(data) => mutate(() => api.updateProject(projectId, data))} />

        <TasksEditor workspace={workspace} onMutate={mutate} />

        <EmployeesEditor workspace={workspace} onMutate={mutate} />

        <MatrixEditor workspace={workspace} onSave={(cells) => mutate(() => api.updateMatrix(cells))} />

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
            </div>
          )}
        </Section>
      </div>
    </main>
  );
}

function ProjectEditor({ workspace, onSave }: { workspace: Workspace; onSave: (data: Record<string, unknown>) => void }) {
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
  const [newTask, setNewTask] = useState<Partial<ProjectTask>>({ name: 'Новая задача', stage: 'analytics', baseHours: 8, complexityLevel: 'L1', isCritical: false, order: workspace.tasks.length + 1 });

  useEffect(() => {
    setDrafts(workspace.tasks);
    setNewTask(current => ({ ...current, order: workspace.tasks.length + 1 }));
  }, [workspace.tasks]);

  function updateDraft(id: string, patch: Partial<ProjectTask>) {
    setDrafts(items => items.map(task => task.id === id ? { ...task, ...patch } : task));
  }

  return (
    <Section title="Задачи проекта" description="Задачи являются входом расчетной модели: часы, сложность и критичность влияют на бюджет и риск.">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2">Задача</th>
              <th className="py-2">Этап</th>
              <th className="py-2">Часы</th>
              <th className="py-2">Сложность</th>
              <th className="py-2">Крит.</th>
              <th className="py-2">Порядок</th>
              <th className="py-2">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drafts.map(task => (
              <tr key={task.id}>
                <td className="py-2"><SmallInput value={task.name} onChange={value => updateDraft(task.id, { name: value })} /></td>
                <td className="py-2"><SmallSelect value={task.stage} options={stages} onChange={value => updateDraft(task.id, { stage: value as ProjectStage })} /></td>
                <td className="py-2"><SmallInput type="number" value={task.baseHours} onChange={value => updateDraft(task.id, { baseHours: numberValue(value) })} /></td>
                <td className="py-2"><SmallSelect value={task.complexityLevel} options={complexities} onChange={value => updateDraft(task.id, { complexityLevel: value as ComplexityLevel })} /></td>
                <td className="py-2"><input type="checkbox" checked={task.isCritical} onChange={event => updateDraft(task.id, { isCritical: event.target.checked })} /></td>
                <td className="py-2"><SmallInput type="number" value={task.order} onChange={value => updateDraft(task.id, { order: numberValue(value) })} /></td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <IconButton title="Сохранить" onClick={() => onMutate(() => api.updateTask(task.id, task))} icon={<Save size={15} />} />
                    <IconButton title="Удалить" onClick={() => onMutate(() => api.deleteTask(task.id))} icon={<Trash2 size={15} />} />
                  </div>
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50">
              <td className="py-2"><SmallInput value={newTask.name || ''} onChange={value => setNewTask({ ...newTask, name: value })} /></td>
              <td className="py-2"><SmallSelect value={newTask.stage || 'analytics'} options={stages} onChange={value => setNewTask({ ...newTask, stage: value as ProjectStage })} /></td>
              <td className="py-2"><SmallInput type="number" value={newTask.baseHours || 0} onChange={value => setNewTask({ ...newTask, baseHours: numberValue(value) })} /></td>
              <td className="py-2"><SmallSelect value={newTask.complexityLevel || 'L1'} options={complexities} onChange={value => setNewTask({ ...newTask, complexityLevel: value as ComplexityLevel })} /></td>
              <td className="py-2"><input type="checkbox" checked={Boolean(newTask.isCritical)} onChange={event => setNewTask({ ...newTask, isCritical: event.target.checked })} /></td>
              <td className="py-2"><SmallInput type="number" value={newTask.order || 1} onChange={value => setNewTask({ ...newTask, order: numberValue(value) })} /></td>
              <td className="py-2"><IconButton title="Добавить" onClick={() => onMutate(() => api.createTask(workspace.project.id, newTask))} icon={<Plus size={15} />} /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function EmployeesEditor({ workspace, onMutate }: { workspace: Workspace; onMutate: (action: () => Promise<unknown>) => void }) {
  const [drafts, setDrafts] = useState<Employee[]>(workspace.employees);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({ name: 'Новый исполнитель', role: 'backend', grade: 'middle', hourRate: 2000, availability: 1 });

  useEffect(() => setDrafts(workspace.employees), [workspace.employees]);

  function updateDraft(id: string, patch: Partial<Employee>) {
    setDrafts(items => items.map(employee => employee.id === id ? { ...employee, ...patch } : employee));
  }

  return (
    <Section title="Исполнители" description="Грейд и ставка исполнителя используются для расчета надежности, трудоемкости и стоимости задач.">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2">Исполнитель</th>
              <th className="py-2">Роль</th>
              <th className="py-2">Грейд</th>
              <th className="py-2">Ставка</th>
              <th className="py-2">Доступность</th>
              <th className="py-2">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drafts.map(employee => (
              <tr key={employee.id}>
                <td className="py-2"><SmallInput value={employee.name} onChange={value => updateDraft(employee.id, { name: value })} /></td>
                <td className="py-2"><SmallInput value={employee.role} onChange={value => updateDraft(employee.id, { role: value })} /></td>
                <td className="py-2"><SmallSelect value={employee.grade} options={grades} onChange={value => updateDraft(employee.id, { grade: value as GradeCode })} /></td>
                <td className="py-2"><SmallInput type="number" value={employee.hourRate} onChange={value => updateDraft(employee.id, { hourRate: numberValue(value) })} /></td>
                <td className="py-2"><SmallInput type="number" step="0.1" value={employee.availability} onChange={value => updateDraft(employee.id, { availability: numberValue(value) })} /></td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <IconButton title="Сохранить" onClick={() => onMutate(() => api.updateEmployee(employee.id, employee))} icon={<Save size={15} />} />
                    <IconButton title="Удалить" onClick={() => onMutate(() => api.deleteEmployee(employee.id))} icon={<Trash2 size={15} />} />
                  </div>
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50">
              <td className="py-2"><SmallInput value={newEmployee.name || ''} onChange={value => setNewEmployee({ ...newEmployee, name: value })} /></td>
              <td className="py-2"><SmallInput value={newEmployee.role || ''} onChange={value => setNewEmployee({ ...newEmployee, role: value })} /></td>
              <td className="py-2"><SmallSelect value={newEmployee.grade || 'middle'} options={grades} onChange={value => setNewEmployee({ ...newEmployee, grade: value as GradeCode })} /></td>
              <td className="py-2"><SmallInput type="number" value={newEmployee.hourRate || 0} onChange={value => setNewEmployee({ ...newEmployee, hourRate: numberValue(value) })} /></td>
              <td className="py-2"><SmallInput type="number" step="0.1" value={newEmployee.availability || 1} onChange={value => setNewEmployee({ ...newEmployee, availability: numberValue(value) })} /></td>
              <td className="py-2"><IconButton title="Добавить" onClick={() => onMutate(() => api.createEmployee(newEmployee))} icon={<Plus size={15} />} /></td>
            </tr>
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
    const firstEmployee = workspace.employees[0];
    if (!firstEmployee) return [];
    return workspace.tasks.map(task => ({ taskId: task.id, employeeId: firstEmployee.id, allocation: 1 }));
  }

  function updateAssignment(taskId: string, patch: Partial<ScenarioAssignment>) {
    if (!draft) return;

    const exists = draft.assignments.some(assignment => assignment.taskId === taskId);
    const nextAssignments = exists
      ? draft.assignments.map(assignment => assignment.taskId === taskId ? { ...assignment, ...patch } : assignment)
      : [...draft.assignments, { taskId, employeeId: workspace.employees[0]?.id || '', allocation: 1, ...patch }];

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
                  return (
                    <tr key={task.id}>
                      <td className="py-2 font-medium text-slate-900">{task.name}</td>
                      <td className="py-2 text-slate-600">{task.complexityLevel}</td>
                      <td className="py-2">
                        <select className="w-full rounded-md border border-slate-300 bg-white px-2 py-1" value={assignment?.employeeId || ''} onChange={event => updateAssignment(task.id, { employeeId: event.target.value })}>
                          <option value="">Не назначено</option>
                          {workspace.employees.map(employee => <option key={employee.id} value={employee.id}>{employee.name} / {employee.grade} / {money(employee.hourRate)}</option>)}
                        </select>
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
