import {
  BadgeHelp,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/cn";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Projects", href: "/new", icon: FolderOpen },
  { label: "Drafts", href: "/drafts", icon: FileText },
  { label: "AI Templates", href: "/editor", icon: WandSparkles },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-gray-200 bg-gray-50 p-4 pt-20 dark:border-zinc-800 dark:bg-zinc-900 lg:flex">
      <div className="mb-8 px-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Sparkles size={20} fill="currentColor" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-gray-950 dark:text-white">Workspace</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">Personal Plan</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (location.pathname === "/editor" && item.label === "Drafts");

          return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-white text-blue-600 shadow-sm dark:bg-zinc-800 dark:text-blue-400"
                : "text-gray-600 hover:bg-white hover:text-gray-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
            )}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 pt-4 dark:border-zinc-800">
        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
          <p className="mb-1 text-xs font-semibold text-blue-700 dark:text-blue-300">Running low on credits</p>
          <p className="mb-3 text-xs leading-relaxed text-blue-600 dark:text-blue-200">
            Upgrade to Pro for unlimited AI-assisted drafting.
          </p>
          <button className="w-full rounded-lg bg-blue-600 py-2 text-xs font-bold text-white transition active:scale-[0.98]">
            Upgrade to Pro
          </button>
        </div>

        <div className="space-y-1">
          <a
            className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white dark:text-zinc-400 dark:hover:bg-zinc-800"
            href="mailto:support@example.com"
          >
            <BadgeHelp size={18} />
            Support
          </a>
          <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white dark:text-zinc-400 dark:hover:bg-zinc-800">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
