import { Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  desc?: string;
  icon?: React.ElementType;
  color?: string;
}

export default function ComingSoon({
  title,
  desc = 'Страница находится в разработке. Скоро будет готова!',
  icon: Icon = Construction,
  color = '#6b5fd4',
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
      <div
        className="w-14 h-14 rounded-[16px] flex items-center justify-center"
        style={{ background: `${color}18` }}
      >
        <Icon style={{ width: 28, height: 28, color }} />
      </div>
      <div className="text-center max-w-xs">
        <h2 className="text-base font-semibold mb-1" style={{ color: '#111827' }}>{title}</h2>
        <p className="text-sm" style={{ color: '#9ca3af' }}>{desc}</p>
      </div>
      <div
        className="px-4 py-1.5 rounded-full text-xs font-medium"
        style={{ background: '#f4f3f8', color: '#9ca3af' }}
      >
        В разработке
      </div>
    </div>
  );
}
