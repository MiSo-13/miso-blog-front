import { useQuery } from "@tanstack/react-query";
import { AlertCircle, FileText, Loader2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { cn } from "../lib/cn";
import { formatDateTime, readingWordCount, statusLabel } from "../lib/format";
import type { BlogPostStatus } from "../types/api";

const statusStyle: Record<BlogPostStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300",
  REVIEW_READY: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  APPROVED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  PUBLISHED: "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950",
};

export default function Drafts() {
  const blogPostsQuery = useQuery({
    queryKey: ["blog-posts"],
    queryFn: api.blogPosts,
  });

  return (
    <div className="pt-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950 dark:text-white">Drafts</h1>
          <p className="mt-2 text-gray-600 dark:text-zinc-400">Review generated posts before approval and publishing.</p>
        </div>
        <Link className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white" to="/new">
          <Plus size={17} />
          New Draft
        </Link>
      </div>

      {blogPostsQuery.isLoading ? (
        <div className="flex min-h-72 items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3 text-sm font-semibold text-gray-600 dark:text-zinc-300">
            <Loader2 className="animate-spin text-blue-600" size={20} />
            Loading drafts from MiSo Blog Server
          </div>
        </div>
      ) : null}

      {blogPostsQuery.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 dark:border-red-500/20 dark:bg-red-500/10">
          <div className="mb-3 flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle size={20} />
            <h2 className="font-bold">Unable to load drafts</h2>
          </div>
          <p className="text-sm leading-relaxed text-red-700/80 dark:text-red-200">
            서버가 실행 중인지 확인해 주세요. 기본 API 주소는 <code>http://localhost:8010</code> 입니다.
          </p>
        </div>
      ) : null}

      {blogPostsQuery.isSuccess && blogPostsQuery.data.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <FileText className="mx-auto mb-4 text-blue-600" size={34} />
          <h2 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">No drafts yet</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-600 dark:text-zinc-400">
            Start with a development blog from local Git analysis or create a general blog from notes and photos.
          </p>
        </div>
      ) : null}

      {blogPostsQuery.isSuccess && blogPostsQuery.data.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {blogPostsQuery.data.map((post) => (
            <article
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-soft dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/40"
              key={post.id}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <span className={cn("rounded px-2 py-1 text-xs font-bold uppercase", statusStyle[post.status])}>
                  {statusLabel(post.status)}
                </span>
                <span className="text-xs text-gray-500 dark:text-zinc-500">{formatDateTime(post.updatedAt)}</span>
              </div>
              <h2 className="mb-2 text-xl font-bold leading-snug text-gray-950 dark:text-white">{post.title}</h2>
              <p className="mb-5 min-h-11 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">
                {post.summary || "No summary has been added yet."}
              </p>
              <div className="mb-5 flex flex-wrap gap-2">
                {post.tags.length > 0 ? (
                  post.tags.map((tag) => (
                    <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" key={tag}>
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 dark:text-zinc-500">No tags</span>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-zinc-800 dark:text-zinc-500">
                <span>v{post.currentVersionNo}</span>
                <span>{readingWordCount(post.summary)} summary words</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
