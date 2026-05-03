import { AlignLeft, ArrowRight, Check, Code2, FolderOpen, LayoutDashboard, Settings, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/cn";

type PathType = "development" | "general";

const paths = [
  {
    id: "development" as const,
    title: "Development Blog",
    description:
      "Optimized for technical documentation, code snippets, and dev-centric topics. Use local Git analysis, commit context, and implementation notes.",
    icon: Code2,
    tone: "blue",
  },
  {
    id: "general" as const,
    title: "General Blog",
    description:
      "Perfect for storytelling, restaurant reviews, travel notes, opinions, and general content with smooth multimedia support.",
    icon: AlignLeft,
    tone: "neutral",
  },
];

export default function ContentPath() {
  const [selected, setSelected] = useState<PathType>("development");
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#faf8ff] text-[#131b2e] dark:bg-zinc-950 dark:text-zinc-50">
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-12 pt-16">
        <section className="mb-12 w-full max-w-[840px] space-y-4 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Workspace Setup</span>
          <h1 className="text-5xl font-bold leading-tight text-[#131b2e] dark:text-white md:text-6xl">
            Choose your content path
          </h1>
          <p className="mx-auto max-w-[600px] text-lg leading-8 text-[#434655] dark:text-zinc-400">
            Select the type of blog that best fits your current project. Lumina AI will tailor its suggestions and
            formatting tools to your choice.
          </p>
        </section>

        <section className="grid w-full max-w-[900px] grid-cols-1 gap-8 md:grid-cols-2">
          {paths.map((path) => {
            const isSelected = selected === path.id;
            const Icon = path.icon;

            return (
              <button
                className={cn(
                  "group relative flex min-h-[300px] cursor-pointer flex-col items-start gap-6 rounded-xl border bg-white p-8 text-left shadow-sm transition duration-300 active:scale-[0.98] dark:bg-zinc-900",
                  isSelected
                    ? "border-blue-600 bg-white shadow-[0_10px_25px_-5px_rgba(0,74,198,0.1)] outline outline-2 outline-blue-700 dark:outline-blue-500"
                    : "border-[#c3c6d7]/30 hover:border-blue-600/20 hover:shadow-md dark:border-zinc-800 dark:hover:border-blue-500/40",
                )}
                key={path.id}
                type="button"
                onClick={() => setSelected(path.id)}
              >
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
                    path.tone === "blue"
                      ? "bg-[#dbe1ff] text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                      : "bg-[#eaedff] text-[#434655] group-hover:bg-[#d3e4fe] group-hover:text-blue-700 dark:bg-zinc-800 dark:text-zinc-300",
                  )}
                >
                  <Icon size={32} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-[#131b2e] dark:text-white">{path.title}</h2>
                  <p className="text-base leading-7 text-[#434655] dark:text-zinc-400">{path.description}</p>
                </div>
                <div
                  className={cn(
                    "mt-auto flex items-center gap-2 pt-4 text-sm font-semibold transition-colors",
                    isSelected ? "text-blue-700 dark:text-blue-300" : "text-[#434655] group-hover:text-blue-700 dark:text-zinc-400",
                  )}
                >
                  <span>Select Path</span>
                  <ArrowRight size={16} />
                </div>
                <div
                  className={cn(
                    "absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected
                      ? "border-blue-700 bg-blue-700 text-white"
                      : "border-[#c3c6d7] group-hover:border-blue-600/40 dark:border-zinc-700",
                  )}
                >
                  {isSelected ? <Check size={13} strokeWidth={3} /> : null}
                </div>
              </button>
            );
          })}
        </section>

        <section className="mt-16 flex w-full flex-col items-center gap-4">
          <button
            className="inline-flex items-center gap-3 rounded-full bg-blue-700 px-12 py-4 font-semibold text-white shadow-lg transition duration-300 hover:scale-[1.03] hover:bg-blue-800 active:scale-[0.98]"
            type="button"
            onClick={() => navigate("/editor", { state: { contentPath: selected } })}
          >
            Continue to Editor
            <Sparkles size={20} fill="currentColor" />
          </button>
          <p className="text-xs font-bold uppercase tracking-widest text-[#737686] dark:text-zinc-500">
            You can change your template later in settings
          </p>
        </section>
      </main>

      <footer className="mt-auto flex flex-col items-center justify-between gap-4 border-t border-gray-100 px-6 py-8 dark:border-zinc-800 md:flex-row">
        <div className="flex items-center gap-6">
          {["Privacy Policy", "Terms of Service", "Documentation"].map((item) => (
            <a className="text-xs font-bold uppercase tracking-wider text-[#434655] transition hover:text-blue-700 dark:text-zinc-400" href="#" key={item}>
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#434655] dark:text-zinc-400">AI Systems Operational</span>
        </div>
      </footer>

      <nav className="fixed bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-8 rounded-full border border-[#c3c6d7] bg-white/90 px-6 py-3 shadow-xl backdrop-blur-lg dark:border-zinc-700 dark:bg-zinc-900/90 md:hidden">
        <LayoutDashboard className="text-blue-700" size={21} />
        <FolderOpen className="text-[#434655] dark:text-zinc-400" size={21} />
        <Sparkles className="text-[#434655] dark:text-zinc-400" size={21} />
        <Settings className="text-[#434655] dark:text-zinc-400" size={21} />
      </nav>
    </div>
  );
}
