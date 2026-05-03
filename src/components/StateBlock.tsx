import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

const toneClass = {
  blue: {
    icon: "text-blue-600 dark:text-blue-400",
    iconWrap: "bg-blue-50 dark:bg-blue-500/10",
    notice: "border-blue-100 bg-blue-50/80 text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100",
  },
  gray: {
    icon: "text-gray-600 dark:text-zinc-300",
    iconWrap: "bg-gray-100 dark:bg-zinc-800",
    notice: "border-gray-200 bg-gray-50 text-gray-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
  },
  amber: {
    icon: "text-amber-700 dark:text-amber-300",
    iconWrap: "bg-amber-50 dark:bg-amber-500/10",
    notice: "border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
  },
};

type StateBlockTone = keyof typeof toneClass;

type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
  tone?: StateBlockTone;
};

export function EmptyState({ action, description, icon: Icon, title, tone = "blue" }: EmptyStateProps) {
  const classes = toneClass[tone];

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${classes.iconWrap}`}>
        <Icon className={classes.icon} size={28} />
      </div>
      <h2 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">{title}</h2>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}

type NoticeProps = {
  children?: ReactNode;
  description: string;
  icon: LucideIcon;
  title?: string;
  tone?: StateBlockTone;
};

export function Notice({ children, description, icon: Icon, title, tone = "gray" }: NoticeProps) {
  const classes = toneClass[tone];

  return (
    <section className={`rounded-lg border p-5 ${classes.notice}`}>
      <div className="flex gap-3">
        <Icon className="mt-0.5 shrink-0" size={20} />
        <div>
          {title ? <h2 className="text-sm font-bold">{title}</h2> : null}
          <p className={title ? "mt-1 text-sm leading-6" : "text-sm leading-6"}>{description}</p>
          {children ? <div className="mt-3">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
