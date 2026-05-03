import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/StateBlock";
import { api } from "../lib/api";
import { cn } from "../lib/cn";
import { formatDateTime, readingWordCount, statusLabel } from "../lib/format";
import type { BlogPostStatus } from "../types/api";

const statusStyle: Record<BlogPostStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300",
  REVIEW_READY: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  APPROVED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  PUBLISHED: "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950",
  FAILED: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

export default function Drafts() {
  const blogPostsQuery = useQuery({
    queryKey: ["blog-posts"],
    queryFn: api.blogPosts,
    retry: false,
  });
  const posts = blogPostsQuery.isSuccess ? blogPostsQuery.data : [];

  return (
    <div className="pt-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950 dark:text-white">초안</h1>
          <p className="mt-2 text-gray-600 dark:text-zinc-400">승인과 발행 전에 작성 중인 글을 검토합니다.</p>
        </div>
        <Link className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white" title="새 초안 작성" to="/new">
          <Plus size={17} />
          새 초안
        </Link>
      </div>

      {blogPostsQuery.isLoading ? (
        <div className="flex min-h-72 items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3 text-sm font-semibold text-gray-600 dark:text-zinc-300">
            <Loader2 className="animate-spin text-blue-600" size={20} />
            초안을 불러오는 중
          </div>
        </div>
      ) : null}

      {!blogPostsQuery.isLoading && posts.length === 0 ? (
        <EmptyState
          description="로컬 Git 분석으로 개발 글을 만들거나 직접 새 글을 작성할 수 있습니다."
          icon={FileText}
          title="아직 초안이 없습니다"
        />
      ) : null}

      {posts.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {posts.map((post) => (
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
                {post.summary || "요약이 아직 없습니다."}
              </p>
              <div className="mb-5 flex flex-wrap gap-2">
                {post.tags.length > 0 ? (
                  post.tags.map((tag) => (
                    <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" key={tag}>
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 dark:text-zinc-500">태그 없음</span>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-zinc-800 dark:text-zinc-500">
                <span>v{post.currentVersionNo}</span>
                <Link className="font-bold text-blue-600 hover:underline dark:text-blue-300" to={`/drafts/${post.id}`}>
                  편집하기
                </Link>
                <span>요약 {readingWordCount(post.summary)}단어</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
