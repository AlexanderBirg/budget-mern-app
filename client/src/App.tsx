import { useState } from 'react';
import { ProjectsPage } from './pages/ProjectsPage';
import { WorkspacePage } from './pages/WorkspacePage';

// В MVP нет роутера: переключение экранов сделано простым состоянием.
export default function App() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  if (!selectedProjectId) {
    return <ProjectsPage onSelectProject={setSelectedProjectId} />;
  }

  return <WorkspacePage projectId={selectedProjectId} onBack={() => setSelectedProjectId(null)} />;
}
