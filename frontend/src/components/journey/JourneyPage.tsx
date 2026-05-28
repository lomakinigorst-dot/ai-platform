'use client';

import { useState } from 'react';
import {
  Bot, TrendingUp, Brain, CheckCircle, ArrowRight, Users,
  Globe, Zap, BarChart3, MessageSquare, UserCheck, Settings,
  PlayCircle, Dna, Radio, Sparkles, Lock, ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type JourneyStep = {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  tag?: string;
  actions?: string[];
  result?: string;
};

type JourneyBlock = {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  steps: JourneyStep[];
};

// ─── Partner journey data ─────────────────────────────────────────────────────

const PARTNER_BLOCKS: JourneyBlock[] = [
  {
    id: 'consultant',
    label: 'AI Консультант',
    icon: Bot,
    color: '#6b5fd4',
    steps: [
      {
        id: 'p-c1',
        title: 'Добавить клиента',
        desc: 'Введите домен клиента — AI сразу запускает сканирование сайта и создаёт базу знаний.',
        icon: Globe,
        color: '#6b5fd4',
        tag: 'Старт',
        actions: ['Ввести домен', 'Запустить сканирование'],
        result: 'База знаний создана, виджет готов к тесту',
      },
      {
        id: 'p-c2',
        title: 'Протестировать в Демо-чате',
        desc: 'Откройте демо-чат и проверьте ответы AI. Ссылку можно отправить клиенту для первого знакомства.',
        icon: PlayCircle,
        color: '#10b981',
        tag: 'Бесплатно',
        actions: ['Открыть демо-чат', 'Отправить ссылку клиенту'],
        result: 'Клиент видит живой AI на своей теме',
      },
      {
        id: 'p-c3',
        title: 'Активировать Trial',
        desc: 'После одобрения клиента — нажмите «Активировать Trial». Клиент получит код виджета и 14 дней бесплатно.',
        icon: Zap,
        color: '#f97316',
        tag: '14 дней',
        actions: ['Нажать «Активировать Trial»', 'Передать код виджета клиенту'],
        result: 'Виджет на сайте клиента, первые диалоги',
      },
      {
        id: 'p-c4',
        title: 'Отслеживать лиды и диалоги',
        desc: 'Во вкладках «Лиды» и «Диалоги» карточки клиента — полная история общения. Партнёр видит маскированные телефоны.',
        icon: MessageSquare,
        color: '#3b82f6',
        actions: ['Открыть вкладку «Лиды»', 'Просмотреть диалоги'],
        result: 'Клиент видит ценность, готов платить',
      },
      {
        id: 'p-c5',
        title: 'Перевести на платный тариф',
        desc: 'Когда trial заканчивается — предложите тариф. Клиент платит вам, маржа 30% остаётся у партнёра.',
        icon: UserCheck,
        color: '#10b981',
        tag: 'Монетизация',
        actions: ['Предложить тариф', 'Выставить счёт'],
        result: '+₽ 6 900–24 900 в месяц от одного клиента',
      },
    ],
  },
  {
    id: 'marketer',
    label: 'AI Маркетолог',
    icon: TrendingUp,
    color: '#fb923c',
    steps: [
      {
        id: 'p-m1',
        title: 'Запустить ДНК-анализ',
        desc: 'AI за 3–5 минут анализирует аудиторию клиента: сегменты, боли, УТП, сценарии поиска.',
        icon: Dna,
        color: '#fb923c',
        tag: 'Бесплатно',
        actions: ['Открыть вкладку «Маркетолог»', 'Нажать «Запустить анализ»'],
        result: '7 разделов ДНК: сегменты, боли, УТП',
      },
      {
        id: 'p-m2',
        title: 'Редактировать УТП',
        desc: 'Скорректируйте УТП и боли клиента. Добавьте конкурентов — AI перегенерирует рекомендации.',
        icon: Settings,
        color: '#6b5fd4',
        actions: ['Редактировать список УТП', 'Добавить конкурентов для анализа'],
        result: 'Точные УТП под конкретный бизнес',
      },
      {
        id: 'p-m3',
        title: 'Генерировать контент',
        desc: 'Попросите AI создать посты, email, скрипты на основе ДНК. Бесплатно без лимита по генерации.',
        icon: Sparkles,
        color: '#8b5cf6',
        tag: 'Бесплатно',
        actions: ['Открыть «AI-генерация»', 'Написать запрос или выбрать быструю задачу'],
        result: 'Готовый контент за 30 секунд',
      },
      {
        id: 'p-m4',
        title: 'Запустить каскадные рассылки',
        desc: 'На платном тарифе: настройте автосеквенции с каскадом Email→TG→WA→VK по сегментам.',
        icon: Radio,
        color: '#f97316',
        tag: 'Платно',
        actions: ['Подключить тариф Маркетолог Pro', 'Создать автосеквенцию'],
        result: 'Лиды из рассылок без ручного труда',
      },
    ],
  },
  {
    id: 'atlas',
    label: 'AI Atlas',
    icon: Brain,
    color: '#a78bfa',
    steps: [
      {
        id: 'p-a1',
        title: 'Задать задачу Atlas',
        desc: 'Опишите бизнес-задачу — Atlas определит нужные AI-блоки и запустит работу. 61 готовый сценарий.',
        icon: Brain,
        color: '#a78bfa',
        tag: 'Оркестратор',
        actions: ['Открыть AI Atlas', 'Выбрать блок и сценарий'],
        result: 'Atlas координирует Консультанта, Маркетолога, HR',
      },
      {
        id: 'p-a2',
        title: 'Подтвердить действие',
        desc: 'Перед каждым важным шагом Atlas покажет цепочку действий и запросит подтверждение.',
        icon: CheckCircle,
        color: '#10b981',
        actions: ['Просмотреть цепочку шагов', 'Нажать «Подтвердить»'],
        result: 'Безопасное выполнение — никакого действия без согласия',
      },
      {
        id: 'p-a3',
        title: 'Получить артефакт',
        desc: 'Результат работы Atlas — КП, отчёт, контент-план, аналитика — сохраняется в «Артефакты».',
        icon: BarChart3,
        color: '#3b82f6',
        actions: ['Открыть «Артефакты»', 'Скачать или отправить клиенту'],
        result: 'Готовый документ для клиента за минуты',
      },
    ],
  },
];

// ─── Client journey data ──────────────────────────────────────────────────────

const CLIENT_BLOCKS: JourneyBlock[] = [
  {
    id: 'consultant',
    label: 'AI Консультант',
    icon: Bot,
    color: '#6b5fd4',
    steps: [
      {
        id: 'c-c1',
        title: 'Получить демо-ссылку',
        desc: 'Партнёр отправляет вам ссылку на демо-чат. Откройте и пообщайтесь с AI — он уже знает ваш бизнес.',
        icon: PlayCircle,
        color: '#10b981',
        tag: 'Без регистрации',
        result: 'AI отвечает на вопросы по вашей теме',
      },
      {
        id: 'c-c2',
        title: 'Установить виджет',
        desc: 'После активации Trial — получите код виджета в Настройках. Вставьте перед </body>. Готово.',
        icon: Globe,
        color: '#6b5fd4',
        tag: '14 дней бесплатно',
        actions: ['Скопировать код виджета', 'Вставить на сайт'],
        result: 'AI работает на вашем сайте 24/7',
      },
      {
        id: 'c-c3',
        title: 'Получать лиды',
        desc: 'Каждый лид — в вашем портале. Имя, телефон (маскированный), запрос. Уведомления в Telegram.',
        icon: UserCheck,
        color: '#10b981',
        actions: ['Открыть «Мои лиды»', 'Настроить Telegram-уведомления'],
        result: 'Лиды 24/7 без менеджера на линии',
      },
      {
        id: 'c-c4',
        title: 'Смотреть аналитику',
        desc: 'Воронка, сентимент, источники трафика, частые вопросы — всё в личном кабинете клиента.',
        icon: BarChart3,
        color: '#3b82f6',
        result: 'Понимание, что спрашивают клиенты',
      },
    ],
  },
  {
    id: 'marketer',
    label: 'AI Маркетолог',
    icon: TrendingUp,
    color: '#fb923c',
    steps: [
      {
        id: 'c-m1',
        title: 'Увидеть свой ДНК-анализ',
        desc: 'Партнёр запускает ДНК-анализ вашего бизнеса. Вы получаете готовые сегменты, боли и УТП.',
        icon: Dna,
        color: '#fb923c',
        tag: 'Бесплатно',
        result: 'Ясное понимание своей аудитории',
      },
      {
        id: 'c-m2',
        title: 'Скорректировать УТП',
        desc: 'Через портал клиента — редактируйте списки УТП и болей. Изменения подхватывает AI.',
        icon: Settings,
        color: '#6b5fd4',
        actions: ['Открыть портал клиента', 'Отредактировать УТП'],
        result: 'AI консультант использует ваши точные формулировки',
      },
      {
        id: 'c-m3',
        title: 'Получить контент',
        desc: 'Партнёр генерирует для вас посты, email, скрипты. Вы согласовываете и публикуете.',
        icon: Sparkles,
        color: '#8b5cf6',
        result: 'Готовый контент без копирайтера',
      },
    ],
  },
  {
    id: 'atlas',
    label: 'AI Atlas',
    icon: Brain,
    color: '#a78bfa',
    steps: [
      {
        id: 'c-a1',
        title: 'Задать вопрос Atlas',
        desc: 'В вашем портале — чат с Atlas. Задавайте любые вопросы по бизнесу, аналитике, стратегии.',
        icon: Brain,
        color: '#a78bfa',
        tag: 'Только клиент',
        result: 'AI-советник по бизнесу без найма консультанта',
      },
      {
        id: 'c-a2',
        title: 'Получить отчёт',
        desc: 'Atlas подготовит аналитику по вашему виджету: конверсии, проблемные зоны, рекомендации.',
        icon: BarChart3,
        color: '#3b82f6',
        actions: ['Запросить «Сделай P&L»', 'Скачать отчёт'],
        result: 'Готовые решения вместо сырых данных',
      },
    ],
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function StepCard({ step, index, isLast }: { step: JourneyStep; index: number; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  const Icon = step.icon;
  return (
    <div className="flex gap-4">
      {/* Timeline */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ background: step.color }}>
          <Icon style={{ width: 16, height: 16 }} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 mt-2" style={{ background: step.color + '40', minHeight: 24 }} />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-5">
        <div
          className="rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-md"
          style={{ background: '#fff', border: `1px solid ${open ? step.color + '60' : '#f0f0f5'}` }}
          onClick={() => setOpen(o => !o)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ background: '#f3f4f6', color: '#9ca3af' }}>
                {index + 1}
              </span>
              <h4 className="text-sm font-semibold" style={{ color: '#111827' }}>{step.title}</h4>
              {step.tag && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: step.color + '18', color: step.color }}>
                  {step.tag}
                </span>
              )}
            </div>
            <ChevronRight
              style={{ width: 14, height: 14, color: '#9ca3af', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </div>
          <p className="text-xs mt-1.5 ml-8" style={{ color: '#6b7280' }}>{step.desc}</p>

          {open && (
            <div className="mt-3 ml-8 space-y-2 border-t pt-3" style={{ borderColor: '#f3f4f6' }}>
              {step.actions && step.actions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: '#9ca3af' }}>ЧТО СДЕЛАТЬ</p>
                  <div className="space-y-1">
                    {step.actions.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs" style={{ color: '#374151' }}>
                        <CheckCircle style={{ width: 12, height: 12, color: step.color, flexShrink: 0 }} />
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {step.result && (
                <div className="rounded-lg px-3 py-2 mt-2"
                  style={{ background: step.color + '10', border: `1px solid ${step.color}30` }}>
                  <p className="text-xs font-semibold" style={{ color: step.color }}>✓ Результат</p>
                  <p className="text-xs mt-0.5" style={{ color: '#374151' }}>{step.result}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BlockJourney({ block }: { block: JourneyBlock }) {
  const Icon = block.icon;
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f5' }}>
      <button
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
        style={{ background: block.color + '08' }}
        onClick={() => setExpanded(e => !e)}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: block.color + '20' }}>
          <Icon style={{ width: 18, height: 18, color: block.color }} />
        </div>
        <span className="flex-1 text-sm font-semibold" style={{ color: '#111827' }}>{block.label}</span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: block.color + '18', color: block.color }}>
          {block.steps.length} шагов
        </span>
        <ChevronRight
          style={{ width: 14, height: 14, color: '#9ca3af', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>
      {expanded && (
        <div className="px-5 pt-4 pb-2">
          {block.steps.map((step, i) => (
            <StepCard key={step.id} step={step} index={i} isLast={i === block.steps.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function JourneyPage() {
  const [mode, setMode] = useState<'partner' | 'client'>('partner');
  const blocks = mode === 'partner' ? PARTNER_BLOCKS : CLIENT_BLOCKS;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b"
        style={{ background: '#fff', borderColor: '#f0f0f5' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Путь клиента</h1>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              Путь {mode === 'partner' ? 'партнёра (агентства)' : 'клиента'} по платформе — шаг за шагом
            </p>
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f3f4f6' }}>
            <button onClick={() => setMode('partner')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: mode === 'partner' ? '#fff' : 'transparent', color: mode === 'partner' ? '#6b5fd4' : '#9ca3af', boxShadow: mode === 'partner' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
              <Users style={{ width: 14, height: 14 }} />
              Партнёр
            </button>
            <button onClick={() => setMode('client')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: mode === 'client' ? '#fff' : 'transparent', color: mode === 'client' ? '#6b5fd4' : '#9ca3af', boxShadow: mode === 'client' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
              <Bot style={{ width: 14, height: 14 }} />
              Клиент
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6" style={{ background: '#fafafa' }}>
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Intro banner */}
          <div className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: mode === 'partner' ? '#ede9ff' : '#d1fae5', border: `1px solid ${mode === 'partner' ? '#c4b5fd' : '#a7f3d0'}` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: mode === 'partner' ? '#6b5fd4' : '#10b981' }}>
              {mode === 'partner'
                ? <Users style={{ width: 16, height: 16, color: '#fff' }} />
                : <Bot style={{ width: 16, height: 16, color: '#fff' }} />
              }
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: mode === 'partner' ? '#3730a3' : '#065f46' }}>
                {mode === 'partner'
                  ? 'Путь партнёра: от добавления клиента до монетизации'
                  : 'Путь клиента: от демо-чата до первых лидов'
                }
              </p>
              <p className="text-xs mt-0.5" style={{ color: mode === 'partner' ? '#4c1d95' : '#064e3b' }}>
                {mode === 'partner'
                  ? 'Разворачивайте каждый блок — внутри конкретные шаги, действия и результаты'
                  : 'Показывайте эту карту клиенту на онбординге — он увидит весь путь'
                }
              </p>
            </div>
          </div>

          {/* Block journeys */}
          {blocks.map(block => (
            <BlockJourney key={block.id} block={block} />
          ))}

          {/* Locked blocks notice */}
          <div className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
            <Lock style={{ width: 16, height: 16, color: '#9ca3af' }} />
            <p className="text-sm" style={{ color: '#6b7280' }}>
              Путь клиента для AI HR, AI Финансы, AI Юрист и AI Продажи — доступен после подключения соответствующих блоков.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
