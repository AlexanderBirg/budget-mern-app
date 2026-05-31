import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { Section } from '../components/Section';
import type { Employee, GradeCode } from '../types/domain';

const grades: GradeCode[] = ['intern', 'junior', 'middle', 'senior'];

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Отдельный экран справочника исполнителей.
// Исполнители не принадлежат конкретному проекту: они используются во всех проектах и сценариях.
export function EmployeesPage({ onBack }: { onBack: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadEmployees() {
    setError(null);
    const data = await api.getEmployees();
    setEmployees(data);
  }

  useEffect(() => {
    loadEmployees()
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки исполнителей'))
      .finally(() => setLoading(false));
  }, []);

  function updateDraft(id: string, patch: Partial<Employee>) {
    setEmployees(items => items.map(employee => employee.id === id ? { ...employee, ...patch } : employee));
  }

  function addEmployee() {
    setEmployees(items => [
      ...items,
      {
        id: `emp-new-${Date.now()}`,
        name: 'Новый исполнитель',
        role: 'general',
        grade: 'middle',
        hourRate: 1000,
        availability: 1,
      },
    ]);
  }

  function removeEmployee(id: string) {
    setEmployees(items => items.filter(employee => employee.id !== id));
  }

  async function saveEmployees() {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const saved = await api.replaceEmployees(employees);
      setEmployees(saved);
      setMessage('Справочник исполнителей сохранен');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения исполнителей');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-slate-600">Загрузка исполнителей...</div>;

  return (
    <main className="mx-auto max-w-7xl p-8">
      <button onClick={onBack} className="mb-4 text-sm text-slate-500 hover:text-slate-900">← К проектам</button>

      <div className="mb-6">
        <p className="text-sm uppercase tracking-wide text-slate-500">Справочник системы</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Исполнители</h1>
        <p className="mt-2 max-w-4xl text-slate-600">
          Исполнители хранятся отдельно от проектов. Внутри проекта они выбираются при настройке сценариев назначений.
        </p>
      </div>

      {error && <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {message && <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
      {saving && <div className="mb-6 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Сохранение исполнителей...</div>}

      <Section title="Редактирование исполнителей" description="Все изменения выполняются в таблице локально и сохраняются одной групповой операцией.">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={addEmployee}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Plus size={16} /> Добавить исполнителя
          </button>

          <button
            onClick={saveEmployees}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} /> Сохранить исполнителей
          </button>
        </div>

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
              {employees.map(employee => (
                <tr key={employee.id}>
                  <td className="py-2"><SmallInput value={employee.name} onChange={value => updateDraft(employee.id, { name: value })} /></td>
                  <td className="py-2"><SmallInput value={employee.role} onChange={value => updateDraft(employee.id, { role: value })} /></td>
                  <td className="py-2"><SmallSelect value={employee.grade} options={grades} onChange={value => updateDraft(employee.id, { grade: value as GradeCode })} /></td>
                  <td className="py-2"><SmallInput type="number" value={employee.hourRate} onChange={value => updateDraft(employee.id, { hourRate: numberValue(value) })} /></td>
                  <td className="py-2"><SmallInput type="number" step="0.1" value={employee.availability} onChange={value => updateDraft(employee.id, { availability: numberValue(value) })} /></td>
                  <td className="py-2">
                    <button
                      title="Удалить из списка"
                      onClick={() => removeEmployee(employee.id)}
                      className="inline-flex items-center justify-center rounded-md border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </main>
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
