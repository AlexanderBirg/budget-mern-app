import { useState } from 'react';
import { EmployeesPage } from './pages/EmployeesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { WorkspacePage } from './pages/WorkspacePage';

type Screen = 'projects' | 'employees' | 'workspace';

// В MVP нет отдельного роутера: экраны переключаются состоянием приложения.
export default function App() {
  const [screen, setScreen] = useState<Screen>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  function openProjects() {
    setSelectedProjectId(null);
    setScreen('projects');
  }

  function openEmployees() {
    setSelectedProjectId(null);
    setScreen('employees');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">MERN-система бюджетирования</p>
            <h1 className="text-lg font-semibold text-slate-950">Расчет сценариев ИТ-проекта</h1>
          </div>

          <nav className="flex gap-2">
            <button
              onClick={openProjects}
              className={`rounded-md border px-3 py-2 text-sm ${screen === 'projects' || screen === 'workspace' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
            >
              Проекты
            </button>
            <button
              onClick={openEmployees}
              className={`rounded-md border px-3 py-2 text-sm ${screen === 'employees' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
            >
              Исполнители
            </button>
          </nav>
        </div>
      </header>

      {screen === 'projects' && (
        <ProjectsPage
          onSelectProject={(projectId) => {
            setSelectedProjectId(projectId);
            setScreen('workspace');
          }}
        />
      )}

      {screen === 'employees' && <EmployeesPage onBack={openProjects} />}

      {screen === 'workspace' && selectedProjectId && (
        <WorkspacePage projectId={selectedProjectId} onBack={openProjects} />
      )}
    </div>
  );
}
