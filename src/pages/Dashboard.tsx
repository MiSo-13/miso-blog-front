import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CalendarDays,
  FileText,
  PenLine,
  PlusCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import MetricCard from "../components/MetricCard";
import { api } from "../lib/api";
import { statusLabel } from "../lib/format";

const recentDrafts = [
  {
    title: "Spring Boot OpenAI Cost API Implementation Notes",
    tag: "DEV",
    time: "2h ago",
    words: "1,420 words",
    summary: "Admin API integration, usage estimation, and operational guardrails for monthly AI budgets.",
  },
  {
    title: "성수동 파스타 맛집 방문 후기",
    tag: "GENERAL",
    time: "Yesterday",
    words: "840 words",
    summary: "A warm review draft with place notes, photo placement, required phrases, and local search keywords.",
  },
  {
    title: "Local Git Analysis Flow for Blog Drafting",
    tag: "DEV",
    time: "3 days ago",
    words: "1,180 words",
    summary: "Commit summaries, masked source context, topic candidates, and Markdown draft generation.",
  },
];

export default function Dashboard() {
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
  });

  const serverStatus = healthQuery.isSuccess ? statusLabel(healthQuery.data.status ?? "ONLINE") : "Offline";

  return (
    <div className="pt-8">
      <section className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">Server status: {serverStatus}</p>
          <h1 className="mb-2 text-3xl font-bold leading-tight text-gray-950 dark:text-white">Welcome back, Writer</h1>
          <p className="max-w-2xl text-base leading-relaxed text-gray-600 dark:text-zinc-400">
            Your drafting desk is ready for repository analysis, AI-assisted writing, review, and publishing.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900">
            <CalendarDays size={18} />
            Schedule
          </button>
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition active:scale-[0.98]"
            to="/new"
          >
            <PlusCircle size={18} />
            New Post
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-950 dark:text-white">Recent Drafts</h2>
            <Link className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400" to="/drafts">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {recentDrafts.map((draft) => (
              <article
                className="group rounded-lg border border-transparent bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-soft dark:bg-zinc-900 dark:hover:border-blue-500/40"
                key={draft.title}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                    {draft.tag}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-zinc-500">{draft.time}</span>
                </div>
                <h3 className="mb-3 text-lg font-bold leading-snug text-gray-950 transition group-hover:text-blue-600 dark:text-white">
                  {draft.title}
                </h3>
                <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{draft.summary}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                  <Sparkles size={15} className="text-blue-600" />
                  <span>{draft.words}</span>
                </div>
              </article>
            ))}

            <Link
              className="flex min-h-56 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-gray-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10"
              to="/new"
            >
              <PlusCircle size={34} />
              <p className="mt-3 text-sm font-semibold">Start a new project</p>
            </Link>
          </div>
        </div>

        <aside className="space-y-5 xl:col-span-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-6 text-sm font-bold text-gray-500 dark:text-zinc-400">Quick Stats</h3>
            <div className="space-y-6">
              <MetricCard icon={FileText} label="Total Posts Published" tone="blue" value="24" />
              <MetricCard icon={PenLine} label="Words written this month" tone="amber" value="12,450" />
              <MetricCard icon={TrendingUp} label="Engagement increase" tone="slate" value="+14%" />
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-6 dark:border-blue-500/20 dark:bg-blue-500/10">
            <div className="mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-300">
              <Sparkles size={19} fill="currentColor" />
              <span className="text-xs font-bold">AI Assistant</span>
            </div>
            <p className="mb-4 text-sm font-medium leading-relaxed text-gray-800 dark:text-zinc-100">
              Your local analysis flow has enough source context for a focused implementation post.
            </p>
            <Link className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-300" to="/new">
              Generate Outline <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-2 flex items-end justify-between">
              <p className="text-sm font-bold text-gray-500 dark:text-zinc-400">AI Credits</p>
              <p className="text-xs font-bold text-gray-950 dark:text-white">1,240 / 5,000</p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-800">
              <div className="h-full w-1/4 rounded-full bg-blue-600" />
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-zinc-500">Resets in 12 days</p>
          </div>
        </aside>
      </section>

      <section className="mt-12">
        <h2 className="mb-5 text-2xl font-bold text-gray-950 dark:text-white">Discovery Hub</h2>
        <div className="grid min-h-[420px] grid-cols-1 gap-4 lg:grid-cols-4 lg:grid-rows-2">
          <article className="relative flex min-h-[320px] overflow-hidden rounded-lg bg-zinc-950 p-8 lg:col-span-2 lg:row-span-2">
            <img
              alt="Clean writing workspace with laptop and notebook"
              className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-700 hover:scale-105"
              src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80"
            />
            <div className="relative z-10 mt-auto max-w-md">
              <span className="mb-4 inline-block rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white">Trending</span>
              <h3 className="mb-3 text-3xl font-bold leading-tight text-white">Mastering the Art of AI Prompting</h3>
              <p className="mb-6 text-sm leading-relaxed text-white/75">
                Collaborate with AI while keeping the writer's actual implementation voice intact.
              </p>
              <button className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-gray-950 transition active:scale-[0.98]">
                Read Guide
              </button>
            </div>
          </article>

          <article className="rounded-lg border border-gray-200 bg-gray-50 p-6 transition hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 lg:col-span-2">
            <div className="mb-12 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm dark:bg-zinc-800">
                <TrendingUp size={24} />
              </div>
              <ArrowUpRight className="text-gray-400" size={21} />
            </div>
            <h4 className="mb-1 font-bold text-gray-950 dark:text-white">SEO Content Optimizer</h4>
            <p className="text-sm text-gray-600 dark:text-zinc-400">Audit posts against search intent and keyword coverage.</p>
          </article>

          <article className="rounded-lg bg-amber-100 p-6 text-amber-950 transition hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-100">
            <Sparkles size={26} />
            <h4 className="mt-12 font-bold">Image Generator</h4>
          </article>

          <article className="rounded-lg bg-slate-200 p-6 text-slate-900 transition hover:bg-slate-300 dark:bg-zinc-800 dark:text-zinc-100">
            <FileText size={26} />
            <h4 className="mt-12 font-bold">Multilingual Sync</h4>
          </article>
        </div>
      </section>
    </div>
  );
}
