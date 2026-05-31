import type { ReactNode } from 'react';

interface Props {
  title: string;
  value: ReactNode;
  note?: string;
}

// Небольшая строгая карточка для ключевых показателей проекта.
export function StatCard({ title, value, note }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {note && <div className="mt-1 text-sm text-slate-500">{note}</div>}
    </div>
  );
}
