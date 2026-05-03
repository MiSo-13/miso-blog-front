import { RefreshCw } from "lucide-react";
import { cn } from "../lib/cn";
import { statusLabel } from "../lib/format";
import type { AiJob } from "../types/api";

type AiJobStatusPanelProps = {
  job?: AiJob;
  title: string;
  isRetrying: boolean;
  onRetry: () => void;
};

export default function AiJobStatusPanel({ job, title, isRetrying, onRetry }: AiJobStatusPanelProps) {
  if (!job) {
    return null;
  }

  const isFailed = job.status === "FAILED";
  const message = job.failure?.message || job.errorMessage;
  const guide = job.failure?.actionGuide;

  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2 text-sm",
        isFailed
          ? "border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100"
          : "bg-gray-50 text-gray-600 dark:bg-zinc-900 dark:text-zinc-300",
      )}
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold">
            {title}: {statusLabel(job.status)}
          </p>
          {job.retryCount > 0 ? <p className="mt-1 text-xs opacity-80">재시도 {job.retryCount}회</p> : null}
        </div>
        {isFailed && job.retryable ? (
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-950 dark:text-amber-100 dark:ring-amber-500/20 dark:hover:bg-zinc-900"
            disabled={isRetrying}
            title={`${title} 재시도`}
            type="button"
            onClick={onRetry}
          >
            <RefreshCw className={cn(isRetrying && "animate-spin")} size={14} />
            {isRetrying ? "재시도 중" : "재시도"}
          </button>
        ) : null}
      </div>
      {isFailed && message ? <p className="mt-2 text-xs leading-5 opacity-90">{message}</p> : null}
      {isFailed && guide ? <p className="mt-1 text-xs leading-5 opacity-80">{guide}</p> : null}
    </div>
  );
}
