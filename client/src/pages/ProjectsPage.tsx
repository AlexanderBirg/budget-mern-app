import { useEffect, useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { api } from '../api/client';
import type { Project } from '../types/domain';

interface Props {
  onSelectProject: (projectId: string) => void;
}

interface ProjectDraft {
  name: string;
  description: string;
  budgetLimit: number;
  deadlineDays: number;
  minStabilityIndex: number;
  workHoursPerDay: number;
  minAllowedProbability: number;
}

const defaultDraft: ProjectDraft = {
  name: 'Новый ИТ-проект',
  description: 'Описание проекта разработки ИТ-продукта',
  budgetLimit: 1_500_000,
  deadlineDays: 80,
  minStabilityIndex: 0.55,
  workHoursPerDay: 8,
  minAllowedProbability: 0.25,
};

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Стартовая страница: здесь пользователь выбирает существующий проект или создает новый.
export function ProjectsPage({ onSelectProject }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draft, setDraft] = useState<ProjectDraft>(defaultDraft);

  async function loadProjects() {
    setError(null);
    const data = await api.getProjects();
    setProjects(data);
  }

  useEffect(() => {
    loadProjects()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreateProject() {
    setSaving(true);
    setError(null);

    try {
      const created = await api.createProject(draft);
      setDraft(defaultDraft);
      setIsCreateOpen(false);
      await loadProjects();
      onSelectProject(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания проекта');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-slate-600">Загрузка проектов...</div>;
  if (error && projects.length === 0) return <div className="p-8 text-red-700">Ошибка: {error}</div>;

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">Программное средство</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Бюджетирование процесса разработки ИТ-проекта</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Учебно-дипломное приложение для сравнения сценариев команды по бюджету, сроку и устойчивости.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700"
        >
          <Plus size={18} />
          Создать проект
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {isCreateOpen && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Новый проект</h2>
              <p className="mt-1 text-sm text-slate-500">
                Задайте базовые ограничения. Задачи, сценарии и назначения добавляются после открытия проекта.
              </p>
            </div>
            <button
              onClick={() => setIsCreateOpen(false)}
              className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
              title="Закрыть форму"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Название проекта
              <input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Описание
              <input
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Лимит бюджета, руб.
              <input
                type="number"
                value={draft.budgetLimit}
                onChange={(event) => setDraft({ ...draft, budgetLimit: numberValue(event.target.value) })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Дедлайн, дней
              <input
                type="number"
                value={draft.deadlineDays}
                onChange={(event) => setDraft({ ...draft, deadlineDays: numberValue(event.target.value) })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Минимальная устойчивость
              <input
                type="number"
                step="0.01"
                value={draft.minStabilityIndex}
                onChange={(event) => setDraft({ ...draft, minStabilityIndex: numberValue(event.target.value) })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Минимальная p(g,l)
              <input
                type="number"
                step="0.01"
                value={draft.minAllowedProbability}
                onChange={(event) => setDraft({ ...draft, minAllowedProbability: numberValue(event.target.value) })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Часов в рабочем дне
              <input
                type="number"
                value={draft.workHoursPerDay}
                onChange={(event) => setDraft({ ...draft, workHoursPerDay: numberValue(event.target.value) })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={handleCreateProject}
              disabled={saving || !draft.name.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? 'Создание...' : 'Создать и открыть'}
            </button>
            <button
              onClick={() => setDraft(defaultDraft)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Сбросить поля
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold">Проекты</h2>
          <p className="mt-1 text-sm text-slate-500">Выберите проект для просмотра исходных данных и запуска расчета.</p>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Проекты пока не созданы. Нажмите «Создать проект», чтобы начать настройку кейса.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="block w-full px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="font-medium text-slate-900">{project.name}</div>
                <div className="mt-1 text-sm text-slate-500">
                  Бюджет: {project.budgetLimit.toLocaleString('ru-RU')} ₽ · Срок: {project.deadlineDays} дней · Мин. устойчивость: {project.minStabilityIndex}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
