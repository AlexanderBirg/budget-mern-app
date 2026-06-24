import { useState } from 'react';

type ViewMode = 'print' | 'presentation';

const criticalSections = [
  {
    number: 1,
    title: 'Аналитика и ТЗ',
    tasks: 'Требования, бизнес-процессы, техническое задание',
    reason: 'Ошибки на раннем этапе приводят к переработке последующих работ.',
  },
  {
    number: 2,
    title: 'Архитектура и БД',
    tasks: 'Архитектура системы, структура базы данных',
    reason: 'Определяют основу backend-логики, API и интеграционных решений.',
  },
  {
    number: 3,
    title: 'Backend-логика',
    tasks: 'Авторизация, роли, API заявок, API пользователей',
    reason: 'Влияет на личный кабинет, административную панель и интеграции.',
  },
  {
    number: 4,
    title: 'Личный кабинет',
    tasks: 'UI/UX-дизайн и frontend личного кабинета',
    reason: 'Является ключевым пользовательским контуром проекта.',
  },
  {
    number: 5,
    title: 'CRM-интеграция',
    tasks: 'Обмен данными с внешней CRM',
    reason: 'Содержит повышенный риск из-за зависимости от внешней системы.',
  },
  {
    number: 6,
    title: 'Интеграция frontend с API',
    tasks: 'Связка интерфейса, backend-логики и интеграций',
    reason: 'Выявляет несогласованность компонентов и вызывает повторные доработки.',
  },
  {
    number: 7,
    title: 'Тестирование',
    tasks: 'Тест-кейсы и функциональное тестирование',
    reason: 'Позволяет выявить критические дефекты до релиза.',
  },
  {
    number: 8,
    title: 'Стабилизация и релиз',
    tasks: 'Исправление дефектов, развертывание и релиз',
    reason: 'Определяет готовность системы к внедрению.',
  },
];

const criteria = [
  'высокий уровень сложности или внешние зависимости',
  'влияние на несколько последующих задач',
  'риск роста бюджета и сдвига срока проекта',
];

export default function CriticalProjectMapPage() {
  const [mode, setMode] = useState<ViewMode>('print');

  const isPrint = mode === 'print';

  const pageClass = isPrint
    ? 'bg-white text-slate-950'
    : 'bg-slate-100 text-slate-950';

  const wrapperClass = isPrint
    ? 'bg-white border border-slate-300'
    : 'bg-white shadow-sm ring-1 ring-slate-200';

  const headerBadgeClass = isPrint
    ? 'border border-slate-400 bg-white text-slate-900'
    : 'bg-blue-50 text-blue-700 ring-1 ring-blue-100';

  const cardClass = isPrint
    ? 'border border-slate-300 bg-white'
    : 'border border-slate-200 bg-white shadow-sm';

  const numberClass = isPrint
    ? 'border border-slate-500 bg-white text-slate-900'
    : 'bg-slate-900 text-white';

  const noteClass = isPrint
    ? 'border-t border-slate-200 text-slate-700'
    : 'border-t border-blue-100 text-slate-600';

  const centerClass = isPrint
    ? 'border border-slate-300 bg-white'
    : 'border border-blue-100 bg-blue-50/60';

  const criteriaClass = isPrint
    ? 'border border-slate-300 bg-white'
    : 'border border-slate-200 bg-slate-50';

  return (
    <main className={`min-h-screen p-4 lg:p-8 ${pageClass}`}>
      <div
        className={`mx-auto max-w-[1280px] rounded-2xl p-5 lg:p-8 ${wrapperClass}`}
      >
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div
              className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${headerBadgeClass}`}
            >
              Карта критических участков
            </div>

            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              Критические задачи расчетного проекта
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Схема показывает участки, отклонения по которым способны повлиять
              на бюджет, срок и устойчивость сценария реализации ИТ-проекта.
            </p>
          </div>

          <div className="flex shrink-0 rounded-xl border border-slate-300 bg-white p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode('print')}
              className={`rounded-lg px-4 py-2 transition ${
                isPrint
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Для печати
            </button>

            <button
              type="button"
              onClick={() => setMode('presentation')}
              className={`rounded-lg px-4 py-2 transition ${
                !isPrint
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Цветной
            </button>
          </div>
        </header>

        <section className={`mb-5 rounded-xl p-4 ${centerClass}`}>
          <div className="grid gap-3 lg:grid-cols-[260px_1fr] lg:items-center">
            <div className="text-base font-bold">
              Центр влияния на бюджетирование
            </div>

            <p className="text-sm leading-6 text-slate-600">
              Критические задачи выделяются до формирования сценариев
              распределения работ. При назначении исполнителей по таким задачам
              учитываются сложность, зависимости и риск повторных доработок.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {criticalSections.map((section) => (
            <article
              key={section.number}
              className={`rounded-xl p-4 ${cardClass}`}
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-md font-bold ${numberClass}`}
                >
                  {section.number}
                </div>

                <h2 className="text-lg font-bold leading-tight">
                  {section.title}
                </h2>
              </div>

              <div className="text-md leading-5 text-slate-700">
                {section.tasks}
              </div>

              <div className={`mt-3 pt-3 text-md leading-5 ${noteClass}`}>
                {section.reason}
              </div>
            </article>
          ))}
        </section>

        <section className={`mt-5 rounded-xl p-4 ${criteriaClass}`}>
          <div className="grid gap-3 lg:grid-cols-[220px_1fr] lg:items-center">
            <div>
              <h2 className="text-base font-bold">Критерии выделения</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Задача считается критической, если ее отклонение влияет не
                только на собственную трудоемкость.
              </p>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              {criteria.map((item) => (
                <div
                  key={item}
                  className={
                    isPrint
                      ? 'rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700'
                      : 'rounded-lg bg-white px-3 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200'
                  }
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-5 text-center text-xs text-slate-500">
          Рисунок N – Карта критических участков расчетного проекта
        </footer>
      </div>
    </main>
  );
}
