import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ru });
}

export function formatDate(date: string) {
  return format(new Date(date), 'd MMM yyyy, HH:mm', { locale: ru });
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Ожидает',
    indexing: 'Индексация',
    active: 'Активен',
    error: 'Ошибка',
    new: 'Новый',
    contacted: 'Связались',
    closed: 'Закрыт',
  };
  return map[status] ?? status;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    indexing: 'bg-blue-100 text-blue-800',
    pending: 'bg-gray-100 text-gray-700',
    error: 'bg-red-100 text-red-800',
    new: 'bg-yellow-100 text-yellow-800',
    contacted: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700';
}

export function modeLabel(mode: string) {
  return mode === 'sales' ? 'Продажник' : 'Поддержка';
}
