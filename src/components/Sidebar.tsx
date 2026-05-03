import {
  BadgeHelp,
  Activity,
  FileText,
  FolderOpen,
  Github,
  Images,
  LayoutDashboard,
  PenLine,
  ScrollText,
  Settings,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/cn";

const navItems = [
  { label: "대시보드", href: "/", icon: LayoutDashboard },
  { label: "프로젝트", href: "/projects", icon: FolderOpen },
  { label: "GitHub 분석", href: "/github-projects", icon: Github },
  { label: "초안", href: "/drafts", icon: FileText },
  { label: "글쓰기", href: "/new", icon: PenLine },
  { label: "이미지", href: "/media", icon: Images },
  { label: "AI 작업", href: "/jobs", icon: ScrollText },
  { label: "OpenAI", href: "/openai", icon: Activity },
  { label: "설정", href: "/settings", icon: Settings },
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
            <p className="text-sm font-extrabold text-gray-950 dark:text-white">작업 공간</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">MiSo Blog</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (location.pathname === "/editor" && item.label === "초안");

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
        <div className="space-y-1">
          <Link
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              location.pathname === "/guide"
                ? "bg-white text-blue-600 shadow-sm dark:bg-zinc-800 dark:text-blue-400"
                : "text-gray-600 hover:bg-white dark:text-zinc-400 dark:hover:bg-zinc-800",
            )}
            to="/guide"
          >
            <BadgeHelp size={18} />
            도움말
          </Link>
        </div>
      </div>
    </aside>
  );
}
