import type { ComparisonResult, Employee, MatrixCell, OptimizeProjectResponse, Project, ProjectTask, Scenario, Workspace } from '../types/domain';

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

function json(method: string, body?: unknown): RequestInit {
  return { method, body: body ? JSON.stringify(body) : undefined };
}

export const api = {
  getProjects: () => request<Project[]>('/projects'),
  createProject: (data: Partial<Project>) => request<Project>('/projects', json('POST', data)),
  getEmployees: () => request<Employee[]>('/employees'),
  getWorkspace: (projectId: string) => request<Workspace>(`/projects/${projectId}/workspace`),
  calculateProject: (projectId: string) => request<ComparisonResult>(`/projects/${projectId}/calculate`, json('POST')),
  optimizeProject: (projectId: string, data?: Record<string, unknown>) => request<OptimizeProjectResponse>(`/projects/${projectId}/optimize`, json('POST', data || {})),

  // Проект.
  updateProject: (projectId: string, data: Partial<Project>) => request<Project>(`/projects/${projectId}`, json('PUT', data)),

  // Задачи проекта.
  createTask: (projectId: string, data: Partial<ProjectTask>) => request<ProjectTask>(`/projects/${projectId}/tasks`, json('POST', data)),
  replaceProjectTasks: (projectId: string, tasks: ProjectTask[]) => request<ProjectTask[]>(`/projects/${projectId}/tasks/bulk`, json('PUT', { tasks })),
  updateTask: (taskId: string, data: Partial<ProjectTask>) => request<ProjectTask>(`/tasks/${taskId}`, json('PATCH', data)),
  deleteTask: (taskId: string) => request<{ ok: boolean }>(`/tasks/${taskId}`, json('DELETE')),

  // Исполнители.
  createEmployee: (data: Partial<Employee>) => request<Employee>('/employees', json('POST', data)),
  replaceEmployees: (employees: Employee[]) => request<Employee[]>('/employees/bulk', json('PUT', { employees })),
  updateEmployee: (employeeId: string, data: Partial<Employee>) => request<Employee>(`/employees/${employeeId}`, json('PATCH', data)),
  deleteEmployee: (employeeId: string) => request<{ ok: boolean }>(`/employees/${employeeId}`, json('DELETE')),

  // Матрица модели.
  updateMatrix: (cells: MatrixCell[]) => request<MatrixCell[]>('/risk-matrix/default', json('PUT', { cells })),

  // Сценарии и назначения.
  createScenario: (projectId: string, data: Partial<Scenario>) => request<Scenario>(`/projects/${projectId}/scenarios`, json('POST', data)),
  updateScenario: (scenarioId: string, data: Partial<Scenario>) => request<Scenario>(`/scenarios/${scenarioId}`, json('PATCH', data)),
  deleteScenario: (scenarioId: string) => request<{ ok: boolean }>(`/scenarios/${scenarioId}`, json('DELETE')),
};
