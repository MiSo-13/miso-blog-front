import { Bell, CircleHelp, Moon, Plus, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "../lib/cn";

export default function TopBar() {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const isEditor = location.pathname === "/editor" || /^\/drafts\/\d+$/.test(location.pathname);
  const isContentPath = location.pathname === "/new";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.classList.toggle("light", !darkMode);
  }, [darkMode]);

  return (
    <header className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 sm:px-6">
      <div className="flex items-center gap-5 lg:gap-8">
        <Link className="text-lg font-bold text-gray-950 dark:text-white" to="/">
          MiSo Blog
        </Link>
        {isEditor ? (
          <nav className="hidden items-center gap-4 md:flex">
            <NavLink
              className={({ isActive }) =>
                cn(
                  "border-b-2 py-1 text-sm font-medium transition-colors",
                  isActive || location.pathname === "/editor"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-blue-600 dark:text-zinc-400",
                )
              }
              to="/drafts"
            >
              Drafts
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                cn(
                  "border-b-2 py-1 text-sm font-medium transition-colors",
                  isActive
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-blue-600 dark:text-zinc-400",
                )
              }
              to="/new"
            >
              Projects
            </NavLink>
          </nav>
        ) : isContentPath ? (
          <nav className="ml-2 hidden items-center gap-6 md:flex lg:ml-8">
            {[
              { label: "Dashboard", href: "/" },
              { label: "Projects", href: "/new" },
              { label: "Drafts", href: "/drafts" },
            ].map((item) => {
              const isActive = item.href === "/new";

              return (
                <Link
                  className={cn(
                    "border-b-2 py-1 text-sm font-medium transition-colors",
                    isActive
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400",
                  )}
                  key={item.href}
                  to={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : (
          <label className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900 md:flex">
            <Search size={18} className="text-gray-500" />
            <input
              className="w-64 border-0 bg-transparent p-0 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0 dark:text-zinc-100"
              placeholder="Search projects..."
              type="search"
            />
          </label>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {isContentPath ? (
          <label className="hidden items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900 md:flex">
            <Search size={18} className="text-gray-500" />
            <input
              className="w-48 border-0 bg-transparent p-0 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0 dark:text-zinc-100"
              placeholder="Search templates..."
              type="search"
            />
          </label>
        ) : null}
        {isEditor ? (
          <div className="hidden items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 dark:bg-zinc-900 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-xs font-bold uppercase text-gray-500 dark:text-zinc-400">Ready</span>
          </div>
        ) : null}
        {!isContentPath ? (
          <Link
            className="hidden items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] md:flex"
            to="/new"
          >
            <Plus size={18} />
            New Post
          </Link>
        ) : null}
        <button
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
          title="Toggle theme"
          type="button"
          onClick={() => setDarkMode((value) => !value)}
        >
          {darkMode ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <button
          className="relative rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
          title="Notifications"
          type="button"
        >
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <button
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
          title="Help"
          type="button"
        >
          <CircleHelp size={19} />
        </button>
        <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-sm font-bold text-blue-600 dark:border-zinc-800 dark:bg-zinc-900">
          W
        </div>
      </div>
    </header>
  );
}
