'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi, Client } from '@/lib/api';
import { Bot, Code, Plug } from 'lucide-react';

export default function SettingsTab({ clientId, client }: { clientId: string; client: Client }) {
  const queryClient = useQueryClient();
  const [section, setSection] = useState<'assistant' | 'embed' | 'integrations'>('assistant');

  // Assistant settings
  const [assistant, setAssistant] = useState({
    assistant_name: client.assistant_name,
    assistant_mode: client.assistant_mode,
    assistant_gender: 'male',
    assistant_avatar_url: client.assistant_avatar_url ?? '',
    system_prompt: '',
  });

  const { data: assistantData } = useQuery({
    queryKey: ['assistant-settings', clientId],
    queryFn: () => settingsApi.getAssistant(clientId),
  });

  useEffect(() => {
    if (assistantData) {
      setAssistant(prev => ({ ...prev, ...assistantData, assistant_avatar_url: assistantData.assistant_avatar_url ?? '' }));
    }
  }, [assistantData]);

  const saveMutation = useMutation({
    mutationFn: () => settingsApi.updateAssistant(clientId, {
      ...assistant,
      assistant_avatar_url: assistant.assistant_avatar_url || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['assistant-settings', clientId] });
    },
  });

  // Integrations
  const [integrations, setIntegrations] = useState({
    telegram_chat_id: '',
    bitrix_webhook: '',
    email_notifications: '',
  });

  const { data: intData } = useQuery({
    queryKey: ['integrations', clientId],
    queryFn: () => settingsApi.getIntegrations(clientId),
  });

  useEffect(() => {
    if (intData) setIntegrations(prev => ({ ...prev, ...intData }));
  }, [intData]);

  const saveIntMutation = useMutation({
    mutationFn: () => settingsApi.updateIntegrations(clientId, integrations),
  });

  // Widget embed
  const { data: widgetData } = useQuery({
    queryKey: ['widget-settings', clientId],
    queryFn: () => settingsApi.getWidget(clientId),
  });

  return (
    <div className="max-w-2xl">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {([['assistant', 'Ассистент', Bot], ['embed', 'Код виджета', Code], ['integrations', 'Интеграции', Plug]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              section === id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Assistant */}
      {section === 'assistant' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Настройки ассистента</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя ассистента</label>
            <input
              type="text"
              value={assistant.assistant_name}
              onChange={e => setAssistant(a => ({ ...a, assistant_name: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Режим</label>
            <div className="grid grid-cols-2 gap-3">
              {[['sales', 'Продажник'], ['support', 'Поддержка']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setAssistant(a => ({ ...a, assistant_mode: val as 'sales' | 'support' }))}
                  className={`text-sm py-2.5 border-2 rounded-lg font-medium transition-colors ${
                    assistant.assistant_mode === val
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пол ассистента</label>
            <div className="grid grid-cols-2 gap-3">
              {[['male', 'Мужской'], ['female', 'Женский']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setAssistant(a => ({ ...a, assistant_gender: val }))}
                  className={`text-sm py-2.5 border-2 rounded-lg font-medium transition-colors ${
                    assistant.assistant_gender === val
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL аватара (необязательно)</label>
            <input
              type="url"
              value={assistant.assistant_avatar_url}
              onChange={e => setAssistant(a => ({ ...a, assistant_avatar_url: e.target.value }))}
              placeholder="https://example.com/avatar.jpg"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дополнительный системный промпт</label>
            <textarea
              value={assistant.system_prompt}
              onChange={e => setAssistant(a => ({ ...a, system_prompt: e.target.value }))}
              rows={4}
              placeholder="Дополнительные инструкции для ассистента..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-400"
            />
          </div>

          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {saveMutation.isPending ? 'Сохранение...' : saveMutation.isSuccess ? '✓ Сохранено' : 'Сохранить'}
          </button>
        </div>
      )}

      {/* Embed code */}
      {section === 'embed' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Код виджета для вставки на сайт</h3>
          <p className="text-sm text-gray-500 mb-4">
            Вставьте этот код перед <code className="bg-gray-100 px-1 py-0.5 rounded">&lt;/body&gt;</code> клиентского сайта
          </p>

          <pre className="bg-gray-900 text-green-400 rounded-xl p-5 text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {widgetData?.embed_code || 'Загрузка...'}
          </pre>

          <button
            onClick={() => navigator.clipboard.writeText(widgetData?.embed_code ?? '')}
            className="mt-4 w-full border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Скопировать код
          </button>
        </div>
      )}

      {/* Integrations */}
      {section === 'integrations' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Интеграции</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telegram Chat ID</label>
            <input
              type="text"
              value={integrations.telegram_chat_id}
              onChange={e => setIntegrations(i => ({ ...i, telegram_chat_id: e.target.value }))}
              placeholder="-100123456789"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
            <p className="text-xs text-gray-400 mt-1">Лиды будут приходить в Telegram</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bitrix24 Webhook</label>
            <input
              type="url"
              value={integrations.bitrix_webhook}
              onChange={e => setIntegrations(i => ({ ...i, bitrix_webhook: e.target.value }))}
              placeholder="https://yoursite.bitrix24.ru/rest/1/..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email для уведомлений</label>
            <input
              type="email"
              value={integrations.email_notifications}
              onChange={e => setIntegrations(i => ({ ...i, email_notifications: e.target.value }))}
              placeholder="manager@company.ru"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <button
            onClick={() => saveIntMutation.mutate()}
            disabled={saveIntMutation.isPending}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {saveIntMutation.isPending ? 'Сохранение...' : saveIntMutation.isSuccess ? '✓ Сохранено' : 'Сохранить'}
          </button>
        </div>
      )}
    </div>
  );
}
