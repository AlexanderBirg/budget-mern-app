import type { ComparisonResult, Project, Workspace } from '../types/domain';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Общая функция для запросов к серверу. Здесь специально нет сложной логики авторизации.
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Ошибка запроса' }));
    throw new Error(error.message || 'Ошибка запроса');
  }

  return response.json();
}

export const api = {
  getProjects: () => request<Project[]>('/projects'),
  getWorkspace: (projectId: string) => request<Workspace>(`/projects/${projectId}/workspace`),
  calculateProject: (projectId: string) => request<ComparisonResult>(`/projects/${projectId}/calculate`, { method: 'POST' }),
};
