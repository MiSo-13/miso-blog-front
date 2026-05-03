import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileText, PlusCircle, Send, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatDateTime, statusLabel } from "../lib/format";
import type { BlogPostStatus } from "../types/api";

const statusTone: Record<BlogPostStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300",
  REVIEW_READY: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  APPROVED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  PUBLISHED: "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950",
  FAILED: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

export default function Dashboard() {
  const blogPostsQuery = useQuery({
    queryKey: ["blog-posts"],
    queryFn: api.blogPosts,
    retry: false,
  });
  const posts = blogPostsQuery.isSuccess ? blogPostsQuery.data : [];
  const statusCounts = posts.reduce(
    (acc, post) => {
      acc[post.status] += 1;
      return acc;
    },
    {
      DRAFT: 0,
      REVIEW_READY: 0,
      APPROVED: 0,
      PUBLISHED: 0,
      FAILED: 0,
    } satisfies Record<BlogPostStatus, number>,
  );

  return (
    <div className="pt-8">
      <section className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">MiSo Blog workspace</p>
          <h1 className="mb-2 text-3xl font-bold leading-tight text-gray-950 dark:text-white">Dashboard</h1>
          <p className="max-w-2xl text-base leading-relaxed text-gray-600 dark:text-zinc-400">
            Manage drafts, reviews, approvals, publishing, and export workflows from one place.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
            to="/settings"
          >
            <Settings size={18} />
            Settings
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition active:scale-[0.98]"
            to="/new"
          >
            <PlusCircle size={18} />
            New Post
          </Link>
        </div>
      </section>

      {blogPostsQuery.isSuccess ? (
        <section className="mb-8 grid gap-4 md:grid-cols-4">
          {[
            { label: "Drafts", value: statusCounts.DRAFT, icon: FileText },
            { label: "Review Ready", value: statusCounts.REVIEW_READY, icon: CheckCircle2 },
            { label: "Approved", value: statusCounts.APPROVED, icon: Send },
            { label: "Published", value: statusCounts.PUBLISHED, icon: Send },
          ].map(({ label, value, icon: Icon }) => (
            <article className="rounded-lg border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900" key={label}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-950 dark:text-white">{value}</p>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{label}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-950 dark:text-white">Recent Drafts</h2>
          <Link className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400" to="/drafts">
            View all
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <FileText className="mx-auto mb-4 text-blue-600" size={34} />
            <h3 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">No visible drafts</h3>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-600 dark:text-zinc-400">
              Create a post or connect the server to show current writing work here.
            </p>
            <Link className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white" to="/new">
              <PlusCircle size={17} />
              Start writing
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {posts.slice(0, 6).map((post) => (
              <article
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-soft dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/40"
                key={post.id}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${statusTone[post.status]}`}>
                    {statusLabel(post.status)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-zinc-500">{formatDateTime(post.updatedAt)}</span>
                </div>
                <h3 className="mb-2 text-xl font-bold leading-snug text-gray-950 dark:text-white">{post.title}</h3>
                <p className="mb-5 min-h-11 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">
                  {post.summary || "No summary has been added yet."}
                </p>
                <Link className="text-sm font-bold text-blue-600 hover:underline dark:text-blue-300" to={`/drafts/${post.id}`}>
                  Open editor
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
