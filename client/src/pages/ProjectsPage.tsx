import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Project } from '../types/domain';

interface Props {
  onSelectProject: (projectId: string) => void;
}

// Стартовая страница: выбираем проект, для которого будет открыта рабочая область.
export function ProjectsPage({ onSelectProject }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getProjects()
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-600">Загрузка проектов...</div>;
  if (error) return <div className="p-8 text-red-700">Ошибка: {error}</div>;

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-wide text-slate-500">Программное средство</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Бюджетирование процесса разработки ИТ-проекта</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Учебно-дипломное приложение для сравнения сценариев команды по бюджету, сроку и устойчивости.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold">Проекты</h2>
          <p className="mt-1 text-sm text-slate-500">Выберите проект для просмотра исходных данных и запуска расчета.</p>
        </div>

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
      </div>
    </main>
  );
}
