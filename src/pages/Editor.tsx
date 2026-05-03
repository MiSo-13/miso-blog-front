import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bold,
  ClipboardCheck,
  Code2,
  Copy,
  ExternalLink,
  History,
  Image,
  Italic,
  Link as LinkIcon,
  RefreshCw,
  Send,
  TestTube2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate, useParams } from "react-router-dom";
import AiJobStatusPanel from "../components/AiJobStatusPanel";
import { api } from "../lib/api";
import { cn } from "../lib/cn";
import { countWords, formatDateTime, statusLabel } from "../lib/format";
import type {
  BlogPostVersionDiff,
  BlogPostVersionDiffLine,
  BlogPost,
  BlogPostQualityImprovePayload,
  BlogPostQualityReviewPayload,
  BlogPostRevisionPayload,
  BlogPostStatus,
  CreateBlogPostPayload,
  GitHubPagesConnectionTest,
  UpdateBlogPostPayload,
} from "../types/api";

const initialMarkdown = "";

const toolbar = [
  { label: "굵게", icon: Bold },
  { label: "기울임", icon: Italic },
  { label: "코드", icon: Code2 },
  { label: "이미지", icon: Image },
  { label: "링크", icon: LinkIcon },
];

const statusStyle: Record<BlogPostStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300",
  REVIEW_READY: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  APPROVED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  PUBLISHED: "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950",
  FAILED: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

const statusAction: Partial<Record<BlogPostStatus, { label: string; next: "review-ready" | "approve" | "publish" }>> = {
  DRAFT: { label: "검토 요청", next: "review-ready" },
  REVIEW_READY: { label: "승인", next: "approve" },
  APPROVED: { label: "발행 처리", next: "publish" },
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
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [sourceNote, setSourceNote] = useState("");
  const [reviewMemo, setReviewMemo] = useState("");
  const [targetReader, setTargetReader] = useState("");
  const [monetizationGoal, setMonetizationGoal] = useState("");
  const [revisionInstruction, setRevisionInstruction] = useState("");
  const [additionalMemo, setAdditionalMemo] = useState("");
  const [revisionTone, setRevisionTone] = useState("");
  const [targetLength, setTargetLength] = useState<"SHORT" | "MEDIUM" | "LONG">("LONG");
  const [preserveTitle, setPreserveTitle] = useState(false);
  const [preserveTags, setPreserveTags] = useState(true);
  const [markReviewReadyAfterRevision, setMarkReviewReadyAfterRevision] = useState(true);
  const [revisionJobId, setRevisionJobId] = useState<number | null>(null);
  const [improveJobId, setImproveJobId] = useState<number | null>(null);
  const [maxRevisionRounds, setMaxRevisionRounds] = useState(2);
  const [minimumHumanNaturalnessScore, setMinimumHumanNaturalnessScore] = useState(85);
  const [minimumFactualGroundingScore, setMinimumFactualGroundingScore] = useState(85);
  const [minimumReadabilityScore, setMinimumReadabilityScore] = useState(80);
  const [minimumSeoReadinessScore, setMinimumSeoReadinessScore] = useState(70);
  const [minimumMonetizationReadinessScore, setMinimumMonetizationReadinessScore] = useState(55);
  const [requirePublishReady, setRequirePublishReady] = useState(false);
  const [markReviewReadyWhenPassed, setMarkReviewReadyWhenPassed] = useState(true);
  const [commitMessage, setCommitMessage] = useState("");
  const [selectedGithubTargetId, setSelectedGithubTargetId] = useState<number | null>(null);
  const [githubTargetTestResult, setGithubTargetTestResult] = useState<GitHubPagesConnectionTest | null>(null);
  const [diffFromVersionNo, setDiffFromVersionNo] = useState<number | null>(null);
  const [diffToVersionNo, setDiffToVersionNo] = useState<number | null>(null);
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [includeCanonicalLink, setIncludeCanonicalLink] = useState(true);
  const [includeSourceNote, setIncludeSourceNote] = useState(true);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
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
  const versionsQuery = useQuery({
    queryKey: ["blog-post-versions", blogPostId],
    queryFn: () => api.blogPostVersions(blogPostId!),
    enabled: blogPostId !== null && Number.isFinite(blogPostId),
    retry: false,
  });
  const versionOptions = useMemo(
    () =>
      (versionsQuery.isSuccess ? versionsQuery.data : [])
        .slice()
        .sort((left, right) => left.versionNo - right.versionNo),
    [versionsQuery.data, versionsQuery.isSuccess],
  );
  const canCompareVersions =
    blogPostId !== null &&
    diffFromVersionNo !== null &&
    diffToVersionNo !== null &&
    diffFromVersionNo !== diffToVersionNo;
  const versionDiffQuery = useQuery({
    queryKey: ["blog-post-version-diff", blogPostId, diffFromVersionNo, diffToVersionNo],
    queryFn: () => api.blogPostVersionDiff(blogPostId!, diffFromVersionNo, diffToVersionNo),
    enabled: canCompareVersions,
    retry: false,
  });
  const publishTargetsQuery = useQuery({
    queryKey: ["publish-targets"],
    queryFn: api.publishTargets,
    retry: false,
  });

  const githubTargets = useMemo(
    () =>
      (publishTargetsQuery.isSuccess ? publishTargetsQuery.data : []).filter(
        (target) => target.channel === "GITHUB_PAGES" && target.active,
      ),
    [publishTargetsQuery.data, publishTargetsQuery.isSuccess],
  );
  const selectedGithubTarget = githubTargets.find((target) => target.id === selectedGithubTargetId) ?? null;
  const isGithubTargetTested =
    githubTargetTestResult?.success === true &&
    selectedGithubTargetId !== null &&
    githubTargetTestResult.targetId === selectedGithubTargetId;

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

  useEffect(() => {
    if (versionOptions.length < 2) {
      setDiffFromVersionNo(null);
      setDiffToVersionNo(null);
      return;
    }

    setDiffFromVersionNo((current) => {
      if (current !== null && versionOptions.some((version) => version.versionNo === current)) {
        return current;
      }
      return versionOptions[versionOptions.length - 2].versionNo;
    });
    setDiffToVersionNo((current) => {
      if (current !== null && versionOptions.some((version) => version.versionNo === current)) {
        return current;
      }
      return versionOptions[versionOptions.length - 1].versionNo;
    });
  }, [versionOptions]);

  useEffect(() => {
    if (githubTargets.length === 0) {
      setSelectedGithubTargetId(null);
      setGithubTargetTestResult(null);
      return;
    }

    setSelectedGithubTargetId((current) => {
      if (current !== null && githubTargets.some((target) => target.id === current)) {
        return current;
      }
      return githubTargets.find((target) => target.role === "PRIMARY")?.id ?? githubTargets[0].id;
    });
  }, [githubTargets]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateBlogPostPayload) => api.updateBlogPost(blogPostId!, payload),
    onSuccess: (updated) => {
      refreshBlogPostCache(queryClient, blogPostId, updated);
      queryClient.invalidateQueries({ queryKey: ["blog-post-versions", blogPostId] });
      queryClient.invalidateQueries({ queryKey: ["blog-post-version-diff", blogPostId] });
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
    onSuccess: (review) => {
      if (review.revisionInstruction) {
        setRevisionInstruction(review.revisionInstruction);
      }
    },
  });
  const revisionJobQuery = useQuery({
    queryKey: ["ai-job", revisionJobId],
    queryFn: () => api.job(revisionJobId!),
    enabled: revisionJobId !== null,
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PENDING" || status === "RUNNING" ? 2000 : false;
    },
  });
  const improveJobQuery = useQuery({
    queryKey: ["ai-job", improveJobId],
    queryFn: () => api.job(improveJobId!),
    enabled: improveJobId !== null,
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PENDING" || status === "RUNNING" ? 2000 : false;
    },
  });
  const retryRevisionJobMutation = useMutation({
    mutationFn: (jobId: number) => api.retryJob(jobId),
    onSuccess: (job) => {
      setRevisionJobId(job.id);
    },
  });
  const retryImproveJobMutation = useMutation({
    mutationFn: (jobId: number) => api.retryJob(jobId),
    onSuccess: (job) => {
      setImproveJobId(job.id);
    },
  });
  useEffect(() => {
    const job = revisionJobQuery.data;
    if (!job || job.status !== "SUCCEEDED" || !job.resultBlogPostId) {
      return;
    }

    void queryClient
      .fetchQuery({
        queryKey: ["blog-post", job.resultBlogPostId],
        queryFn: () => api.blogPost(job.resultBlogPostId!),
      })
      .then((updated) => {
        refreshBlogPostCache(queryClient, job.resultBlogPostId, updated);
        setRevisionJobId(null);
      });
  }, [queryClient, revisionJobQuery.data]);
  useEffect(() => {
    const job = improveJobQuery.data;
    if (!job || job.status !== "SUCCEEDED" || !job.resultBlogPostId) {
      return;
    }

    void queryClient
      .fetchQuery({
        queryKey: ["blog-post", job.resultBlogPostId],
        queryFn: () => api.blogPost(job.resultBlogPostId!),
      })
      .then((updated) => {
        refreshBlogPostCache(queryClient, job.resultBlogPostId, updated);
        setImproveJobId(null);
      });
  }, [improveJobQuery.data, queryClient]);
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
      queryClient.invalidateQueries({ queryKey: ["blog-post-versions", blogPostId] });
      queryClient.invalidateQueries({ queryKey: ["blog-post-version-diff", blogPostId] });
    },
  });
  const githubPublishMutation = useMutation({
    mutationFn: () =>
      api.publishGithubPages(blogPostId!, {
        targetId: selectedGithubTargetId,
        commitMessage: commitMessage || null,
      }),
    onSuccess: (result) => {
      if (result.expectedPublicUrl) {
        setCanonicalUrl(result.expectedPublicUrl);
      }
      queryClient.invalidateQueries({ queryKey: ["blog-post", blogPostId] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
  const githubTargetTestMutation = useMutation({
    mutationFn: (targetId: number) => api.testGithubPagesTarget(targetId),
    onSuccess: (result) => setGithubTargetTestResult(result),
    onError: () => setGithubTargetTestResult(null),
  });
  const velogExportMutation = useMutation({
    mutationFn: () =>
      api.exportVelog(blogPostId!, {
        canonicalUrl: canonicalUrl || null,
        includeCanonicalLink,
        includeSourceNote,
      }),
  });

  const currentStatus = blogPostQuery.data?.status;
  const nextStatusAction = currentStatus ? statusAction[currentStatus] : undefined;
  const canSave =
    title.trim().length > 0 &&
    markdown.trim().length > 0 &&
    (blogPostId === null || blogPostQuery.data?.status !== "PUBLISHED");
  const isSaving = updateMutation.isPending || createMutation.isPending;
  const canReview = blogPostId !== null && blogPostQuery.data !== undefined;
  const isRevisionRunning =
    revisionJobQuery.data?.status === "PENDING" ||
    revisionJobQuery.data?.status === "RUNNING";
  const isImproveRunning =
    improveJobQuery.data?.status === "PENDING" ||
    improveJobQuery.data?.status === "RUNNING";
  const canTestGithubTarget = selectedGithubTargetId !== null && !githubTargetTestMutation.isPending;
  const canPublishGithub =
    blogPostId !== null &&
    currentStatus === "APPROVED" &&
    selectedGithubTargetId !== null &&
    isGithubTargetTested;
  const canExportVelog = blogPostId !== null && (currentStatus === "APPROVED" || currentStatus === "PUBLISHED");

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

  const handleRevisionJob = () => {
    if (blogPostId === null || revisionInstruction.trim().length === 0 || isRevisionRunning) {
      return;
    }

    const payload: BlogPostRevisionPayload = {
      revisionInstruction,
      additionalMemo: additionalMemo || null,
      tone: revisionTone || null,
      targetLength,
      preserveTitle,
      preserveTags,
      markReviewReady: markReviewReadyAfterRevision,
    };

    api
      .createRevisionJob(blogPostId, payload)
      .then((job) => {
        setRevisionJobId(job.id);
      })
      .catch(() => {
        setRevisionJobId(null);
      });
  };

  const handleQualityImproveJob = () => {
    if (blogPostId === null || isImproveRunning) {
      return;
    }

    const payload: BlogPostQualityImprovePayload = {
      reviewRequest: {
        originalInputMemo: reviewMemo || null,
        targetReader: targetReader || null,
        monetizationGoal: monetizationGoal || null,
      },
      maxRevisionRounds,
      minimumHumanNaturalnessScore,
      minimumFactualGroundingScore,
      minimumReadabilityScore,
      minimumSeoReadinessScore,
      minimumMonetizationReadinessScore,
      additionalRevisionMemo: additionalMemo || null,
      tone: revisionTone || null,
      targetLength,
      preserveTitle,
      preserveTags,
      requirePublishReady,
      markReviewReadyWhenPassed,
    };

    api
      .createQualityImproveJob(blogPostId, payload)
      .then((job) => {
        setImproveJobId(job.id);
      })
      .catch(() => {
        setImproveJobId(null);
      });
  };

  const handleRetryRevisionJob = () => {
    if (!revisionJobQuery.data?.retryable) {
      return;
    }
    retryRevisionJobMutation.mutate(revisionJobQuery.data.id);
  };

  const handleRetryImproveJob = () => {
    if (!improveJobQuery.data?.retryable) {
      return;
    }
    retryImproveJobMutation.mutate(improveJobQuery.data.id);
  };

  const handleCopy = (label: string, value: string) => {
    if (!value) {
      return;
    }

    void navigator.clipboard?.writeText(value).then(() => {
      setCopiedLabel(label);
      window.setTimeout(() => setCopiedLabel(null), 1200);
    });
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
            {blogPostQuery.isFetching ? "불러오는 중" : `${words}단어`}
          </span>
          {currentStatus ? (
            <span className={cn("hidden rounded px-2 py-1 text-xs font-bold uppercase md:inline", statusStyle[currentStatus])}>
              {statusLabel(currentStatus)}
            </span>
          ) : null}
          {updateMutation.isSuccess || createMutation.isSuccess ? (
            <span className="hidden text-xs font-bold uppercase text-green-600 dark:text-green-400 md:inline">저장됨</span>
          ) : null}
          {nextStatusAction ? (
            <button
              className="hidden items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 lg:inline-flex"
              disabled={statusMutation.isPending}
              title={nextStatusAction.label}
              type="button"
              onClick={handleStatusAction}
            >
              {statusMutation.isPending ? "처리 중" : nextStatusAction.label}
            </button>
          ) : null}
          {blogPostId ? (
            <button
              className="hidden items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/15 md:inline-flex"
              disabled={!canReview || qualityReviewMutation.isPending}
              title="AI 품질 검토"
              type="button"
              onClick={handleQualityReview}
            >
              <ClipboardCheck size={16} />
              검토
            </button>
          ) : null}
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            disabled={!canSave || isSaving}
            title={blogPostId ? "저장" : "초안 생성"}
            type="button"
            onClick={handleSave}
          >
            <Send size={16} />
            {blogPostId ? "저장" : "초안 생성"}
          </button>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full w-full flex-col overflow-y-auto border-r border-gray-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 lg:w-1/2 lg:p-8">
          <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
            <input
              className="border-0 bg-transparent p-0 text-3xl font-semibold leading-tight text-gray-950 outline-none placeholder:text-gray-300 focus:ring-0 dark:text-white dark:placeholder:text-zinc-700"
              placeholder="제목"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">슬러그</span>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                  placeholder="선택 입력"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">태그</span>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                  placeholder="쉼표로 구분"
                  value={tagsText}
                  onChange={(event) => setTagsText(event.target.value)}
                />
              </label>
            </div>

            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">요약</span>
              <textarea
                className="min-h-20 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                placeholder="목록과 발행 메타데이터에 사용할 짧은 요약"
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
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">출처 메모</span>
              <textarea
                className="min-h-20 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                placeholder="출처나 분석 메모를 선택적으로 입력"
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
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">작업 상태</p>
                  <p className="mt-1 text-lg font-bold text-gray-950 dark:text-white">{statusLabel(currentStatus)}</p>
                </div>
                {nextStatusAction ? (
                  <button
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={statusMutation.isPending}
                    title={nextStatusAction.label}
                    type="button"
                    onClick={handleStatusAction}
                  >
                    {statusMutation.isPending ? "처리 중" : nextStatusAction.label}
                  </button>
                ) : (
                  <span className="rounded bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600 dark:bg-zinc-800 dark:text-zinc-300">
                    다음 작업 없음
                  </span>
                )}
              </section>
            ) : null}

            {blogPostId ? (
              <section className="mb-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-4 flex items-center gap-2">
                  <History className="text-blue-600" size={18} />
                  <h2 className="text-base font-bold text-gray-950 dark:text-white">버전 이력</h2>
                </div>
                {versionOptions.length > 0 ? (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {versionOptions.slice(-8).map((version) => (
                      <span
                        className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 dark:bg-zinc-900 dark:text-zinc-300"
                        key={version.id}
                        title={formatDateTime(version.createdAt)}
                      >
                        v{version.versionNo} · {version.action}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mb-4 rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-500 dark:border-zinc-800 dark:text-zinc-500">
                    아직 버전 이력이 없습니다.
                  </p>
                )}
                {versionOptions.length >= 2 ? (
                  <div className="mb-4 grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <label className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">비교 시작</span>
                      <select
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                        title="비교 시작 버전"
                        value={diffFromVersionNo ?? ""}
                        onChange={(event) => setDiffFromVersionNo(event.target.value ? Number(event.target.value) : null)}
                      >
                        {versionOptions.map((version) => (
                          <option key={version.id} value={version.versionNo}>
                            v{version.versionNo} · {version.action}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">비교 대상</span>
                      <select
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                        title="비교 대상 버전"
                        value={diffToVersionNo ?? ""}
                        onChange={(event) => setDiffToVersionNo(event.target.value ? Number(event.target.value) : null)}
                      >
                        {versionOptions.map((version) => (
                          <option key={version.id} value={version.versionNo}>
                            v{version.versionNo} · {version.action}
                          </option>
                        ))}
                      </select>
                    </label>
                    <span className="rounded-lg bg-white px-3 py-2 text-center text-xs font-semibold text-gray-500 dark:bg-zinc-950 dark:text-zinc-400">
                      {versionDiffQuery.isFetching ? "비교 중" : "선택 비교"}
                    </span>
                  </div>
                ) : null}
                {versionOptions.length >= 2 && !canCompareVersions ? (
                  <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:bg-zinc-900 dark:text-zinc-400">
                    서로 다른 두 버전을 선택하면 변경 내용을 볼 수 있습니다.
                  </p>
                ) : (
                  <VersionDiffPanel diff={versionDiffQuery.data} />
                )}
              </section>
            ) : null}

            {blogPostId ? (
              <section className="mb-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-4">
                  <h2 className="text-base font-bold text-gray-950 dark:text-white">발행 및 내보내기</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                    승인된 글을 GitHub Pages로 발행하고 Velog에 옮길 콘텐츠를 준비합니다.
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="grid gap-3">
                      <label className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">GitHub Pages 대상</span>
                        <select
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                          disabled={githubTargets.length === 0}
                          value={selectedGithubTargetId ?? ""}
                          onChange={(event) => {
                            setSelectedGithubTargetId(event.target.value ? Number(event.target.value) : null);
                            setGithubTargetTestResult(null);
                          }}
                        >
                          {githubTargets.length === 0 ? <option value="">설정된 대상 없음</option> : null}
                          {githubTargets.map((target) => (
                            <option key={target.id} value={target.id}>
                              {target.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      {selectedGithubTarget ? (
                        <div className="grid gap-1 text-xs text-gray-500 dark:text-zinc-500">
                          <p>
                            <span className="font-bold text-gray-700 dark:text-zinc-300">저장소:</span>{" "}
                            {selectedGithubTarget.repositoryFullName || "서버 기본값"}
                          </p>
                          <p>
                            <span className="font-bold text-gray-700 dark:text-zinc-300">브랜치:</span>{" "}
                            {selectedGithubTarget.branchName || "main"}
                          </p>
                        </div>
                      ) : null}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <button
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          disabled={!canTestGithubTarget}
                          title="GitHub Pages 연결 테스트"
                          type="button"
                          onClick={() => {
                            if (selectedGithubTargetId !== null) {
                              githubTargetTestMutation.mutate(selectedGithubTargetId);
                            }
                          }}
                        >
                          <TestTube2 size={16} />
                          {githubTargetTestMutation.isPending ? "테스트 중" : "테스트"}
                        </button>
                        <p className="text-xs leading-relaxed text-gray-500 dark:text-zinc-500">
                          {isGithubTargetTested
                            ? `연결 확인됨 · ${formatDateTime(githubTargetTestResult?.checkedAt)}`
                            : "GitHub Pages 발행 전 연결 테스트가 필요합니다."}
                        </p>
                      </div>
                      {githubTargetTestMutation.isError ? (
                        <p className="rounded-lg bg-white px-3 py-2 text-sm text-gray-500 dark:bg-zinc-950 dark:text-zinc-400">
                          연결을 확인하지 못했습니다. 설정값과 서버 상태를 확인해 주세요.
                        </p>
                      ) : null}
                      {githubTargetTestResult && !githubTargetTestResult.success ? (
                        <p className="rounded-lg bg-white px-3 py-2 text-sm text-gray-500 dark:bg-zinc-950 dark:text-zinc-400">
                          {githubTargetTestResult.message || "연결 테스트가 완료되지 않았습니다."}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">GitHub 커밋 메시지</span>
                    <input
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                      placeholder={`글 발행: ${title}`}
                      value={commitMessage}
                      onChange={(event) => setCommitMessage(event.target.value)}
                    />
                  </label>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canPublishGithub || githubPublishMutation.isPending}
                    title="GitHub Pages로 발행"
                    type="button"
                    onClick={() => githubPublishMutation.mutate()}
                  >
                    <ExternalLink size={16} />
                    {githubPublishMutation.isPending ? "발행 중" : "발행"}
                  </button>

                  {githubPublishMutation.data ? (
                    <div className="rounded-lg bg-blue-50 p-3 text-sm leading-6 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200">
                      <p className="font-bold">{githubPublishMutation.data.repositoryFullName}</p>
                      <p>{githubPublishMutation.data.filePath}</p>
                      <div className="mt-2 flex flex-wrap gap-3">
                        {githubPublishMutation.data.commitUrl ? (
                          <a className="font-bold underline" href={githubPublishMutation.data.commitUrl} rel="noreferrer" target="_blank">
                            커밋
                          </a>
                        ) : null}
                        {githubPublishMutation.data.expectedPublicUrl ? (
                          <a className="font-bold underline" href={githubPublishMutation.data.expectedPublicUrl} rel="noreferrer" target="_blank">
                            공개 URL
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-2 border-t border-gray-100 pt-4 dark:border-zinc-800">
                    <label className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Canonical URL</span>
                      <input
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                        placeholder="Canonical URL"
                        value={canonicalUrl}
                        onChange={(event) => setCanonicalUrl(event.target.value)}
                      />
                    </label>
                    <div className="my-3 grid gap-2 text-sm text-gray-600 dark:text-zinc-400 sm:grid-cols-2">
                      <label className="flex items-center gap-2">
                        <input
                          checked={includeCanonicalLink}
                          type="checkbox"
                          onChange={(event) => setIncludeCanonicalLink(event.target.checked)}
                        />
                        Canonical 링크 포함
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          checked={includeSourceNote}
                          type="checkbox"
                          onChange={(event) => setIncludeSourceNote(event.target.checked)}
                        />
                        출처 메모 포함
                      </label>
                    </div>
                    <button
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                      disabled={!canExportVelog || velogExportMutation.isPending}
                      title="Velog용 마크다운 내보내기"
                      type="button"
                      onClick={() => velogExportMutation.mutate()}
                    >
                      <Copy size={16} />
                      {velogExportMutation.isPending ? "내보내는 중" : "내보내기"}
                    </button>
                  </div>

                  {velogExportMutation.data ? (
                    <div className="space-y-3 rounded-lg bg-gray-50 p-3 dark:bg-zinc-900">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-gray-950 dark:text-white">{velogExportMutation.data.title}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-500">{velogExportMutation.data.guide}</p>
                        </div>
                        <button
                          className="rounded bg-white px-2 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-50 dark:bg-zinc-950 dark:text-blue-300 dark:ring-blue-500/20"
                          title="제목 복사"
                          type="button"
                          onClick={() => handleCopy("title", velogExportMutation.data.title)}
                        >
                          {copiedLabel === "title" ? "복사됨" : "제목"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {velogExportMutation.data.tags.map((tag) => (
                          <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" key={tag}>
                            {tag}
                          </span>
                        ))}
                        <button
                          className="rounded bg-white px-2 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-50 dark:bg-zinc-950 dark:text-blue-300 dark:ring-blue-500/20"
                          title="태그 복사"
                          type="button"
                          onClick={() => handleCopy("tags", velogExportMutation.data.tags.join(", "))}
                        >
                          {copiedLabel === "tags" ? "복사됨" : "태그 복사"}
                        </button>
                      </div>
                      <textarea
                        className="min-h-36 w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 font-code text-xs leading-5 text-gray-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                        readOnly
                        value={velogExportMutation.data.markdown}
                      />
                      <button
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition active:scale-[0.98]"
                        title="마크다운 복사"
                        type="button"
                        onClick={() => handleCopy("markdown", velogExportMutation.data.markdown)}
                      >
                        <Copy size={16} />
                        {copiedLabel === "markdown" ? "복사됨" : "마크다운 복사"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {blogPostId ? (
              <section className="mb-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-950 dark:text-white">AI 품질 검토</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">자연스러움, 근거성, 가독성, SEO, 수익화 준비도를 확인합니다.</p>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canReview || qualityReviewMutation.isPending}
                    title="AI 품질 검토"
                    type="button"
                    onClick={handleQualityReview}
                  >
                    <ClipboardCheck size={16} />
                    {qualityReviewMutation.isPending ? "검토 중" : "검토"}
                  </button>
                </div>

                <div className="grid gap-3">
                  <textarea
                    className="min-h-16 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                    placeholder="원문 메모 또는 작성 의도"
                    value={reviewMemo}
                    onChange={(event) => setReviewMemo(event.target.value)}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                      placeholder="대상 독자"
                      value={targetReader}
                      onChange={(event) => setTargetReader(event.target.value)}
                    />
                    <input
                      className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                      placeholder="수익화 목표"
                      value={monetizationGoal}
                      onChange={(event) => setMonetizationGoal(event.target.value)}
                    />
                  </div>
                </div>

                {qualityReviewMutation.data ? (
                  <div className="mt-5 space-y-4">
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        ["자연", qualityReviewMutation.data.humanNaturalnessScore],
                        ["근거", qualityReviewMutation.data.factualGroundingScore],
                        ["가독", qualityReviewMutation.data.readabilityScore],
                        ["SEO", qualityReviewMutation.data.seoReadinessScore],
                        ["수익", qualityReviewMutation.data.monetizationReadinessScore],
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
                        <h3 className="mb-2 text-sm font-bold text-gray-950 dark:text-white">개선 항목</h3>
                        <ul className="space-y-1 text-sm text-gray-600 dark:text-zinc-400">
                          {qualityReviewMutation.data.issues.slice(0, 4).map((issue) => (
                            <li key={issue}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {qualityReviewMutation.data.revisionInstruction ? (
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <h3 className="text-sm font-bold text-gray-950 dark:text-white">수정 지시</h3>
                          <button
                            className="rounded bg-white px-2 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-50 dark:bg-zinc-950 dark:text-blue-300 dark:ring-blue-500/20"
                            title="수정 지시 사용"
                            type="button"
                            onClick={() => setRevisionInstruction(qualityReviewMutation.data.revisionInstruction)}
                          >
                            사용
                          </button>
                        </div>
                        <p className="text-sm leading-6 text-gray-600 dark:text-zinc-400">{qualityReviewMutation.data.revisionInstruction}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            {blogPostId ? (
              <section className="mb-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-950 dark:text-white">AI 수정</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                      품질 검토 지시를 비동기 수정 작업으로 전달합니다.
                    </p>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={revisionInstruction.trim().length === 0 || isRevisionRunning}
                    title="AI 수정 작업 실행"
                    type="button"
                    onClick={handleRevisionJob}
                  >
                    <RefreshCw className={cn(isRevisionRunning && "animate-spin")} size={16} />
                    {isRevisionRunning ? "수정 중" : "수정"}
                  </button>
                </div>

                <div className="grid gap-3">
                  <textarea
                    className="min-h-24 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                    placeholder="수정 지시"
                    value={revisionInstruction}
                    onChange={(event) => setRevisionInstruction(event.target.value)}
                  />
                  <textarea
                    className="min-h-16 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                    placeholder="추가 메모"
                    value={additionalMemo}
                    onChange={(event) => setAdditionalMemo(event.target.value)}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                      placeholder="톤"
                      value={revisionTone}
                      onChange={(event) => setRevisionTone(event.target.value)}
                    />
                    <select
                      className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                      value={targetLength}
                      onChange={(event) => setTargetLength(event.target.value as "SHORT" | "MEDIUM" | "LONG")}
                    >
                      <option value="SHORT">짧게</option>
                      <option value="MEDIUM">보통</option>
                      <option value="LONG">길게</option>
                    </select>
                  </div>
                  <div className="grid gap-2 text-sm text-gray-600 dark:text-zinc-400 sm:grid-cols-3">
                    <label className="flex items-center gap-2">
                      <input checked={preserveTitle} type="checkbox" onChange={(event) => setPreserveTitle(event.target.checked)} />
                      제목 유지
                    </label>
                    <label className="flex items-center gap-2">
                      <input checked={preserveTags} type="checkbox" onChange={(event) => setPreserveTags(event.target.checked)} />
                      태그 유지
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        checked={markReviewReadyAfterRevision}
                        type="checkbox"
                        onChange={(event) => setMarkReviewReadyAfterRevision(event.target.checked)}
                      />
                      검토 대기로 전환
                    </label>
                  </div>
                  <AiJobStatusPanel
                    job={revisionJobQuery.data}
                    isRetrying={retryRevisionJobMutation.isPending}
                    title="수정 작업"
                    onRetry={handleRetryRevisionJob}
                  />
                </div>
              </section>
            ) : null}

            {blogPostId ? (
              <section className="mb-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-950 dark:text-white">자동 품질 개선</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                      설정한 품질 기준을 충족할 때까지 서버가 검토와 수정을 반복합니다.
                    </p>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isImproveRunning}
                    title="자동 품질 개선 실행"
                    type="button"
                    onClick={handleQualityImproveJob}
                  >
                    <RefreshCw className={cn(isImproveRunning && "animate-spin")} size={16} />
                    {isImproveRunning ? "개선 중" : "자동 개선"}
                  </button>
                </div>

                <div className="grid gap-3">
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">최대 수정 라운드</span>
                    <input
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                      max={3}
                      min={1}
                      type="number"
                      value={maxRevisionRounds}
                      onChange={(event) => setMaxRevisionRounds(Number(event.target.value))}
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-5">
                    {[
                      ["자연", minimumHumanNaturalnessScore, setMinimumHumanNaturalnessScore],
                      ["근거", minimumFactualGroundingScore, setMinimumFactualGroundingScore],
                      ["가독", minimumReadabilityScore, setMinimumReadabilityScore],
                      ["SEO", minimumSeoReadinessScore, setMinimumSeoReadinessScore],
                      ["수익", minimumMonetizationReadinessScore, setMinimumMonetizationReadinessScore],
                    ].map(([label, value, setter]) => (
                      <label className="space-y-1" key={label as string}>
                        <span className="text-xs font-bold text-gray-500 dark:text-zinc-500">{label as string}</span>
                        <input
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                          max={100}
                          min={0}
                          type="number"
                          value={value as number}
                          onChange={(event) => (setter as (next: number) => void)(Number(event.target.value))}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="grid gap-2 text-sm text-gray-600 dark:text-zinc-400 sm:grid-cols-2">
                    <label className="flex items-center gap-2">
                      <input checked={requirePublishReady} type="checkbox" onChange={(event) => setRequirePublishReady(event.target.checked)} />
                      발행 가능 판정 필요
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        checked={markReviewReadyWhenPassed}
                        type="checkbox"
                        onChange={(event) => setMarkReviewReadyWhenPassed(event.target.checked)}
                      />
                      통과 시 검토 대기로 전환
                    </label>
                  </div>
                  <AiJobStatusPanel
                    job={improveJobQuery.data}
                    isRetrying={retryImproveJobMutation.isPending}
                    title="품질 개선 작업"
                    onRetry={handleRetryImproveJob}
                  />
                </div>
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

function fieldLabel(fieldName: string) {
  const labels: Record<string, string> = {
    title: "제목",
    slug: "슬러그",
    summary: "요약",
    contentMarkdown: "본문",
    tags: "태그",
    tagsJson: "태그",
  };

  return labels[fieldName] ?? fieldName;
}

function diffLineClass(line: BlogPostVersionDiffLine) {
  if (line.type === "INSERT") {
    return "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200";
  }
  if (line.type === "DELETE") {
    return "bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-200";
  }
  return "bg-gray-50 text-gray-500 dark:bg-zinc-900 dark:text-zinc-500";
}

function diffLinePrefix(line: BlogPostVersionDiffLine) {
  if (line.type === "INSERT") {
    return "+";
  }
  if (line.type === "DELETE") {
    return "-";
  }
  return " ";
}

function VersionDiffPanel({ diff }: { diff?: BlogPostVersionDiff }) {
  if (!diff) {
    return null;
  }

  if (!diff.changed) {
    return (
      <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:bg-zinc-900 dark:text-zinc-400">
        최근 버전 간 변경 내용이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-500/10 dark:text-blue-200 sm:grid-cols-3">
        <p className="font-semibold">
          v{diff.fromVersionNo} → v{diff.toVersionNo}
        </p>
        <p>추가 {diff.addedLineCount}줄</p>
        <p>삭제 {diff.deletedLineCount}줄</p>
      </div>
      {diff.sections
        .filter((section) => section.changed)
        .map((section) => (
          <div className="rounded-lg border border-gray-100 p-3 dark:border-zinc-800" key={section.fieldName}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-gray-950 dark:text-white">{fieldLabel(section.fieldName)}</h3>
              <span className="text-xs text-gray-500 dark:text-zinc-500">
                +{section.addedLineCount} / -{section.deletedLineCount}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-100 font-code text-xs dark:border-zinc-800">
              {section.lines.slice(0, 80).map((line, index) => (
                <div className={cn("grid grid-cols-[2rem_1fr] gap-2 px-2 py-1", diffLineClass(line))} key={`${section.fieldName}-${index}`}>
                  <span className="select-none text-center font-bold">{diffLinePrefix(line)}</span>
                  <span className="whitespace-pre-wrap break-words">{line.text || " "}</span>
                </div>
              ))}
              {section.lines.length > 80 ? (
                <div className="px-3 py-2 text-xs text-gray-500 dark:text-zinc-500">일부 라인만 표시 중입니다.</div>
              ) : null}
            </div>
          </div>
        ))}
    </div>
  );
}
