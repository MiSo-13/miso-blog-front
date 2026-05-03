import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bold, ClipboardCheck, Code2, Image, Italic, Link as LinkIcon, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { cn } from "../lib/cn";
import { countWords } from "../lib/format";
import type {
  BlogPost,
  BlogPostQualityReviewPayload,
  BlogPostStatus,
  CreateBlogPostPayload,
  UpdateBlogPostPayload,
} from "../types/api";

const initialMarkdown = `# Introduction

React Hooks introduced in version 16.8 have fundamentally changed how we build components. By allowing functional components to manage state and side effects, they simplified the component lifecycle.

## Key Concepts

- \`useState\`: For local state management.
- \`useEffect\`: For handling side effects like data fetching.
- \`useContext\`: For subscribing to React context without nesting.

## Why it matters

The biggest benefit is not syntax. Hooks make stateful behavior easier to extract, test, and reuse across focused components.
`;

const toolbar = [
  { label: "Bold", icon: Bold },
  { label: "Italic", icon: Italic },
  { label: "Code", icon: Code2 },
  { label: "Image", icon: Image },
  { label: "Link", icon: LinkIcon },
];

const statusStyle: Record<BlogPostStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300",
  REVIEW_READY: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  APPROVED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  PUBLISHED: "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950",
  FAILED: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

const statusAction: Partial<Record<BlogPostStatus, { label: string; next: "review-ready" | "approve" | "publish" }>> = {
  DRAFT: { label: "Mark Review Ready", next: "review-ready" },
  REVIEW_READY: { label: "Approve", next: "approve" },
  APPROVED: { label: "Mark Published", next: "publish" },
};

function refreshBlogPostCache(queryClient: ReturnType<typeof useQueryClient>, blogPostId: number | null, updated: BlogPost) {
  queryClient.setQueryData(["blog-post", blogPostId], updated);
  queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
}

export default function Editor() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const blogPostId = params.blogPostId ? Number(params.blogPostId) : null;
  const [title, setTitle] = useState("The Impact of React Hooks on Frontend Architecture");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [tagsText, setTagsText] = useState("React, Frontend, Architecture");
  const [sourceNote, setSourceNote] = useState("");
  const [reviewMemo, setReviewMemo] = useState("");
  const [targetReader, setTargetReader] = useState("");
  const [monetizationGoal, setMonetizationGoal] = useState("");
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const words = useMemo(() => countWords(`${title} ${markdown}`), [markdown, title]);
  const tags = useMemo(
    () =>
      tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsText],
  );

  const blogPostQuery = useQuery({
    queryKey: ["blog-post", blogPostId],
    queryFn: () => api.blogPost(blogPostId!),
    enabled: blogPostId !== null && Number.isFinite(blogPostId),
    retry: false,
  });

  useEffect(() => {
    if (!blogPostQuery.data) {
      return;
    }

    setTitle(blogPostQuery.data.title);
    setSlug(blogPostQuery.data.slug ?? "");
    setSummary(blogPostQuery.data.summary ?? "");
    setTagsText(blogPostQuery.data.tags.join(", "));
    setSourceNote(blogPostQuery.data.sourceNote ?? "");
    setMarkdown(blogPostQuery.data.contentMarkdown);
  }, [blogPostQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateBlogPostPayload) => api.updateBlogPost(blogPostId!, payload),
    onSuccess: (updated) => {
      refreshBlogPostCache(queryClient, blogPostId, updated);
    },
  });
  const createMutation = useMutation({
    mutationFn: (payload: CreateBlogPostPayload) => api.createManualDraft(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      navigate(`/drafts/${created.id}`, { replace: true });
    },
  });
  const qualityReviewMutation = useMutation({
    mutationFn: (payload: BlogPostQualityReviewPayload) => api.reviewBlogPostQuality(blogPostId!, payload),
  });
  const statusMutation = useMutation({
    mutationFn: async (next: "review-ready" | "approve" | "publish") => {
      if (next === "review-ready") {
        return api.markReviewReady(blogPostId!);
      }
      if (next === "approve") {
        return api.approveBlogPost(blogPostId!);
      }
      return api.markPublished(blogPostId!);
    },
    onSuccess: (updated) => {
      refreshBlogPostCache(queryClient, blogPostId, updated);
    },
  });

  const currentStatus = blogPostQuery.data?.status;
  const nextStatusAction = currentStatus ? statusAction[currentStatus] : undefined;
  const canSave =
    title.trim().length > 0 &&
    markdown.trim().length > 0 &&
    (blogPostId === null || blogPostQuery.data?.status !== "PUBLISHED");
  const isSaving = updateMutation.isPending || createMutation.isPending;
  const canReview = blogPostId !== null && blogPostQuery.data !== undefined;

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    const payload = {
      title,
      slug: slug || null,
      summary: summary || null,
      contentMarkdown: markdown,
      tags,
      sourceNote: sourceNote || null,
    };

    if (blogPostId === null) {
      createMutation.mutate(payload);
      return;
    }

    updateMutation.mutate(payload);
  };

  const handleQualityReview = () => {
    if (!canReview) {
      return;
    }

    qualityReviewMutation.mutate({
      originalInputMemo: reviewMemo || null,
      targetReader: targetReader || null,
      monetizationGoal: monetizationGoal || null,
    });
  };

  const handleStatusAction = () => {
    if (!nextStatusAction || blogPostId === null) {
      return;
    }

    statusMutation.mutate(nextStatusAction.next);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-white dark:bg-zinc-950">
      <section className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
        <div className="flex items-center gap-1">
          {toolbar.slice(0, 2).map((item) => (
            <button
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-blue-300"
              key={item.label}
              title={item.label}
              type="button"
            >
              <item.icon size={19} />
            </button>
          ))}
          <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-zinc-800" />
          {toolbar.slice(2).map((item) => (
            <button
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-blue-300"
              key={item.label}
              title={item.label}
              type="button"
            >
              <item.icon size={19} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-xs font-semibold uppercase text-gray-500 dark:text-zinc-400 sm:inline">
            {blogPostQuery.isFetching ? "Loading..." : `${words} Words`}
          </span>
          {currentStatus ? (
            <span className={cn("hidden rounded px-2 py-1 text-xs font-bold uppercase md:inline", statusStyle[currentStatus])}>
              {currentStatus.replace(/_/g, " ").toLowerCase()}
            </span>
          ) : null}
          {updateMutation.isSuccess || createMutation.isSuccess ? (
            <span className="hidden text-xs font-bold uppercase text-green-600 dark:text-green-400 md:inline">Saved</span>
          ) : null}
          {nextStatusAction ? (
            <button
              className="hidden items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 lg:inline-flex"
              disabled={statusMutation.isPending}
              type="button"
              onClick={handleStatusAction}
            >
              {statusMutation.isPending ? "Updating" : nextStatusAction.label}
            </button>
          ) : null}
          {blogPostId ? (
            <button
              className="hidden items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/15 md:inline-flex"
              disabled={!canReview || qualityReviewMutation.isPending}
              type="button"
              onClick={handleQualityReview}
            >
              <ClipboardCheck size={16} />
              Review
            </button>
          ) : null}
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            disabled={!canSave || isSaving}
            type="button"
            onClick={handleSave}
          >
            <Send size={16} />
            {blogPostId ? "Save" : "Create Draft"}
          </button>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full w-full flex-col overflow-y-auto border-r border-gray-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 lg:w-1/2 lg:p-8">
          <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
            <input
              className="border-0 bg-transparent p-0 text-3xl font-semibold leading-tight text-gray-950 outline-none placeholder:text-gray-300 focus:ring-0 dark:text-white dark:placeholder:text-zinc-700"
              placeholder="Post Title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Slug</span>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                  placeholder="optional-slug"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Tags</span>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                  placeholder="Spring Boot, OpenAI"
                  value={tagsText}
                  onChange={(event) => setTagsText(event.target.value)}
                />
              </label>
            </div>

            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Summary</span>
              <textarea
                className="min-h-20 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                placeholder="Short summary for list cards and publishing metadata"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
              />
            </label>

            <div className="flex gap-4">
              <div className="w-1 shrink-0 rounded-full bg-blue-600" />
              <textarea
                className="min-h-[620px] flex-1 resize-none border-0 bg-transparent p-0 font-code text-sm leading-7 text-gray-700 outline-none placeholder:text-gray-300 focus:ring-0 dark:text-zinc-300"
                value={markdown}
                onChange={(event) => setMarkdown(event.target.value)}
              />
            </div>

            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Source Note</span>
              <textarea
                className="min-h-20 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                placeholder="Optional source or analysis note"
                value={sourceNote}
                onChange={(event) => setSourceNote(event.target.value)}
              />
            </label>
          </div>
        </div>

        <article className="hidden h-full w-1/2 overflow-y-auto bg-gray-50 p-8 dark:bg-zinc-900 lg:block">
          <div className="markdown-preview mx-auto max-w-[720px]">
            {blogPostId && currentStatus ? (
              <section className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Workflow Status</p>
                  <p className="mt-1 text-lg font-bold text-gray-950 dark:text-white">{currentStatus.replace(/_/g, " ").toLowerCase()}</p>
                </div>
                {nextStatusAction ? (
                  <button
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={statusMutation.isPending}
                    type="button"
                    onClick={handleStatusAction}
                  >
                    {statusMutation.isPending ? "Updating" : nextStatusAction.label}
                  </button>
                ) : (
                  <span className="rounded bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600 dark:bg-zinc-800 dark:text-zinc-300">
                    No next action
                  </span>
                )}
              </section>
            ) : null}

            {blogPostId ? (
              <section className="mb-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-950 dark:text-white">AI Quality Review</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Check naturalness, grounding, readability, SEO, and monetization readiness.</p>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canReview || qualityReviewMutation.isPending}
                    type="button"
                    onClick={handleQualityReview}
                  >
                    <ClipboardCheck size={16} />
                    {qualityReviewMutation.isPending ? "Reviewing" : "Review"}
                  </button>
                </div>

                <div className="grid gap-3">
                  <textarea
                    className="min-h-16 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                    placeholder="Original memo or writing intent"
                    value={reviewMemo}
                    onChange={(event) => setReviewMemo(event.target.value)}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                      placeholder="Target reader"
                      value={targetReader}
                      onChange={(event) => setTargetReader(event.target.value)}
                    />
                    <input
                      className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                      placeholder="Monetization goal"
                      value={monetizationGoal}
                      onChange={(event) => setMonetizationGoal(event.target.value)}
                    />
                  </div>
                </div>

                {qualityReviewMutation.data ? (
                  <div className="mt-5 space-y-4">
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        ["Human", qualityReviewMutation.data.humanNaturalnessScore],
                        ["Facts", qualityReviewMutation.data.factualGroundingScore],
                        ["Read", qualityReviewMutation.data.readabilityScore],
                        ["SEO", qualityReviewMutation.data.seoReadinessScore],
                        ["Money", qualityReviewMutation.data.monetizationReadinessScore],
                      ].map(([label, score]) => (
                        <div className="rounded-lg bg-gray-50 p-2 text-center dark:bg-zinc-900" key={label}>
                          <p className="text-xs font-bold text-gray-500 dark:text-zinc-500">{label}</p>
                          <p className="text-lg font-bold text-gray-950 dark:text-white">{score}</p>
                        </div>
                      ))}
                    </div>
                    <p className="rounded-lg bg-blue-50 p-3 text-sm font-semibold leading-6 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200">
                      {qualityReviewMutation.data.verdict}
                    </p>
                    {qualityReviewMutation.data.issues.length > 0 ? (
                      <div>
                        <h3 className="mb-2 text-sm font-bold text-gray-950 dark:text-white">Issues</h3>
                        <ul className="space-y-1 text-sm text-gray-600 dark:text-zinc-400">
                          {qualityReviewMutation.data.issues.slice(0, 4).map((issue) => (
                            <li key={issue}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {qualityReviewMutation.data.revisionInstruction ? (
                      <div>
                        <h3 className="mb-2 text-sm font-bold text-gray-950 dark:text-white">Revision Instruction</h3>
                        <p className="text-sm leading-6 text-gray-600 dark:text-zinc-400">{qualityReviewMutation.data.revisionInstruction}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            {title.trim() ? <h1>{title}</h1> : null}
            {summary.trim() ? <p className="text-lg text-gray-600 dark:text-zinc-300">{summary}</p> : null}
            {tags.length > 0 ? (
              <div className="my-5 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        </article>
      </section>
    </div>
  );
}
