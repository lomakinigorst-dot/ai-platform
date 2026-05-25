'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, Bot, Loader2 } from 'lucide-react';

export default function NewClientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    domain: '',
    website_url: '',
    assistant_mode: 'sales',
  });

  const mutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.push(`/clients/${client.id}`);
    },
  });

  const handleUrlChange = (url: string) => {
    setForm(f => ({
      ...f,
      website_url: url,
      domain: url ? (url.replace(/^https?:\/\//, '').split('/')[0]) : f.domain,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.domain || !form.website_url) return;
    mutation.mutate(form);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back */}
      <Link href="/clients" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Назад к клиентам
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Новый клиент</h1>
      <p className="text-gray-500 text-sm mb-8">
        После добавления AI автоматически просканирует сайт и создаст базу знаний
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            Информация о компании
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название компании *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="ООО Ромашка"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Адрес сайта *
            </label>
            <input
              type="url"
              value={form.website_url}
              onChange={e => handleUrlChange(e.target.value)}
              placeholder="https://example.ru"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Домен подставится автоматически</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Домен *
            </label>
            <input
              type="text"
              value={form.domain}
              onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
              placeholder="example.ru"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              required
            />
          </div>
        </div>

        {/* Assistant */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-600" />
            Режим ассистента
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'sales', label: 'Продажник', desc: 'Собирает лиды и контакты, консультирует по продуктам' },
              { value: 'support', label: 'Поддержка', desc: 'Отвечает на вопросы строго по базе знаний' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, assistant_mode: opt.value }))}
                className={`text-left p-4 border-2 rounded-xl transition-colors ${
                  form.assistant_mode === opt.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm text-gray-900">{opt.label}</div>
                <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            Ошибка при создании клиента. Проверьте данные и попробуйте снова.
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Создаём и запускаем сканирование...
            </>
          ) : (
            'Добавить клиента и просканировать сайт'
          )}
        </button>
      </form>
    </div>
  );
}
