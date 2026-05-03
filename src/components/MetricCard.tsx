import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "blue" | "amber" | "slate";
};

const toneClass = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  slate: "bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-zinc-200",
};

export default function MetricCard({ icon: Icon, label, value, tone }: MetricCardProps) {
  return (
    <div className="flex items-center gap-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClass[tone]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-950 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-zinc-400">{label}</p>
      </div>
    </div>
  );
}
