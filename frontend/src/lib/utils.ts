import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    demo: "bg-[#f4f3f8] text-[#6b7280]",
    new: "bg-[#ede9ff] text-[#6b5fd4]",
    trial: "bg-[#fff3e8] text-[#f97316]",
    pro: "bg-[#dcfce7] text-[#16a34a]",
    mega: "bg-[#dbeafe] text-[#2563eb]",
    active: "bg-[#dcfce7] text-[#16a34a]",
    inactive: "bg-[#f4f3f8] text-[#9ca3af]",
  }
  return map[status?.toLowerCase()] ?? "bg-[#f4f3f8] text-[#6b7280]"
}

export function modeLabel(mode: string): string {
  const map: Record<string, string> = {
    simple: "Простой",
    expert: "Эксперт",
    sales: "Продажи",
    support: "Поддержка",
  }
  return map[mode?.toLowerCase()] ?? mode
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "только что"
  if (seconds < 3600) return `${Math.floor(seconds / 60)} мин назад`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч назад`
  return `${Math.floor(seconds / 86400)} д назад`
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    demo: "Демо",
    new: "Новый",
    trial: "Триал",
    pro: "Pro",
    mega: "Mega",
    active: "Активный",
    inactive: "Неактивный",
  }
  return map[status?.toLowerCase()] ?? status
}
