import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock3, FileText, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState, Notice } from "../components/StateBlock";
import { api } from "../lib/api";
import { cn } from "../lib/cn";
import { formatDateTime, statusLabel } from "../lib/format";
import type { AiJob, AiJobStatus } from "../types/api";

const statusTone: Record<AiJobStatus, string> = {
  PENDING: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300",
  RUNNING: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  SUCCEEDED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  FAILED: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
};

const jobTypeLabel: Record<string, string> = {
  GENERAL_BLOG_DRAFT: "일반 블로그 초안",
  BLOG_POST_REVISION: "AI 추가 수정",
  BLOG_POST_QUALITY_IMPROVE: "자동 품질 개선",
};

function typeLabel(type: string) {
  return jobTypeLabel[type] ?? type.replace(/_/g, " ").toLowerCase();
}

export default function AiJobs() {
  const queryClient = useQueryClient();
  const jobsQuery = useQuery({
    queryKey: ["ai-jobs"],
    queryFn: api.jobs,
    retry: false,
    refetchInterval: (query) => {
      const jobs = query.state.data ?? [];
      return jobs.some((job) => job.status === "PENDING" || job.status === "RUNNING") ? 3000 : false;
    },
  });
  const retryMutation = useMutation({
    mutationFn: (jobId: number) => api.retryJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-jobs"] });
    },
  });
  const jobs = jobsQuery.isSuccess ? jobsQuery.data : [];
  const counts = jobs.reduce(
    (acc, job) => {
      acc[job.status] += 1;
      return acc;
    },
    {
      PENDING: 0,
      RUNNING: 0,
      SUCCEEDED: 0,
      FAILED: 0,
    } satisfies Record<AiJobStatus, number>,
  );

  return (
    <div className="pt-8">
      <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">AI 작업</p>
          <h1 className="mb-2 text-3xl font-bold text-gray-950 dark:text-white">작업 히스토리</h1>
          <p className="max-w-2xl text-gray-600 dark:text-zinc-400">
            생성, 수정, 자동 개선 작업의 진행 상태와 실패 재시도를 관리합니다.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={jobsQuery.isFetching}
          title="작업 목록 새로고침"
          type="button"
          onClick={() => void jobsQuery.refetch()}
        >
          <RefreshCw className={cn(jobsQuery.isFetching && "animate-spin")} size={17} />
          새로고침
        </button>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <StatusCard icon={Clock3} label="대기 중" value={counts.PENDING} />
        <StatusCard icon={Loader2} label="진행 중" value={counts.RUNNING} spinning={counts.RUNNING > 0} />
        <StatusCard icon={CheckCircle2} label="완료" value={counts.SUCCEEDED} />
        <StatusCard icon={AlertCircle} label="확인 필요" value={counts.FAILED} />
      </section>

      {jobs.length === 0 ? (
        <EmptyState
          description="서버가 연결되고 AI 작업이 생성되면 이곳에 목록이 표시됩니다."
          icon={Clock3}
          title="표시할 AI 작업이 없습니다"
        />
      ) : (
        <section className="grid gap-4">
          {jobs.map((job) => (
            <AiJobCard
              isRetrying={retryMutation.isPending && retryMutation.variables === job.id}
              job={job}
              key={job.id}
              onRetry={(jobId) => retryMutation.mutate(jobId)}
            />
          ))}
        </section>
      )}

      {jobsQuery.isError ? (
        <div className="mt-6">
          <Notice
            description="작업 목록을 불러오지 못했습니다. 서버 상태를 확인해 주세요."
            icon={AlertCircle}
            tone="gray"
          />
        </div>
      ) : null}
    </div>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  spinning,
}: {
  icon: typeof Clock3;
  label: string;
  value: number;
  spinning?: boolean;
}) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
        <Icon className={cn(spinning && "animate-spin")} size={20} />
      </div>
      <p className="text-2xl font-bold text-gray-950 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-zinc-400">{label}</p>
    </article>
  );
}

function AiJobCard({ job, isRetrying, onRetry }: { job: AiJob; isRetrying: boolean; onRetry: (jobId: number) => void }) {
  const message = job.failure?.message || job.errorMessage;
  const guide = job.failure?.actionGuide;
  const isActive = job.status === "PENDING" || job.status === "RUNNING";

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={cn("rounded px-2 py-1 text-xs font-bold uppercase", statusTone[job.status])}>
              {statusLabel(job.status)}
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-zinc-500">#{job.id}</span>
            {job.retryCount > 0 ? (
              <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 dark:bg-zinc-800 dark:text-zinc-300">
                재시도 {job.retryCount}회
              </span>
            ) : null}
          </div>
          <h2 className="text-lg font-bold text-gray-950 dark:text-white">{typeLabel(job.type)}</h2>
          <div className="mt-2 grid gap-1 text-xs text-gray-500 dark:text-zinc-500 sm:grid-cols-3">
            <p>생성 {formatDateTime(job.createdAt)}</p>
            <p>시작 {formatDateTime(job.startedAt)}</p>
            <p>완료 {formatDateTime(job.finishedAt)}</p>
          </div>
          {message ? <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{message}</p> : null}
          {guide ? <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-zinc-500">{guide}</p> : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {isActive ? (
            <span className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              <Loader2 className="animate-spin" size={16} />
              진행 중
            </span>
          ) : null}
          {job.resultBlogPostId ? (
            <Link
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
              title="결과 초안 열기"
              to={`/drafts/${job.resultBlogPostId}`}
            >
              <FileText size={16} />
              열기
            </Link>
          ) : null}
          {job.status === "FAILED" && job.retryable ? (
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isRetrying}
              title="AI 작업 재시도"
              type="button"
              onClick={() => onRetry(job.id)}
            >
              <RotateCcw className={cn(isRetrying && "animate-spin")} size={16} />
              {isRetrying ? "재시도 중" : "재시도"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
