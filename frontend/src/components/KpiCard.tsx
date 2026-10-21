import type { LucideIcon } from 'lucide-react';

type KpiCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
};

export default function KpiCard({
  title,
  value,
  icon: Icon,
}: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <Icon className="text-blue-600" size={22} />
      </div>

      <p className="mt-4 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}
