import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, Calculator, DollarSign, ExternalLink, KeyRound, RefreshCw, Server, WalletCards } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { api } from "../lib/api";
import { formatDateTime } from "../lib/format";

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return toDateInput(date);
}

function usd(value?: number | null) {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(value);
}

function integer(value?: number | null) {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

export default function OpenAiOperations() {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(toDateInput(new Date()));
  const [costGroupBy, setCostGroupBy] = useState("project_id,line_item");
  const [usageGroupBy, setUsageGroupBy] = useState("model,api_key_id");
  const [bucketWidth, setBucketWidth] = useState("1d");
  const [estimateForm, setEstimateForm] = useState({
    model: "gpt-4.1-mini",
    inputTokens: 10000,
    cachedInputTokens: 0,
    outputTokens: 2000,
  });

  const summaryQuery = useQuery({
    queryKey: ["openai-summary"],
    queryFn: api.openAiSummary,
    retry: false,
  });
  const costsQuery = useQuery({
    queryKey: ["openai-costs", startDate, endDate, costGroupBy],
    queryFn: () => api.openAiCosts({ startDate, endDate, groupBy: costGroupBy }),
    retry: false,
  });
  const usageQuery = useQuery({
    queryKey: ["openai-usage", startDate, endDate, bucketWidth, usageGroupBy],
    queryFn: () => api.openAiUsage({ startDate, endDate, bucketWidth, groupBy: usageGroupBy }),
    retry: false,
  });
  const estimateMutation = useMutation({
    mutationFn: () => api.openAiEstimate(estimateForm),
  });

  const maxBucketCost = useMemo(() => {
    const buckets = costsQuery.isSuccess ? costsQuery.data.buckets : [];
    return Math.max(...buckets.map((bucket) => bucket.costUsd), 0);
  }, [costsQuery.data, costsQuery.isSuccess]);

  const updateEstimate = (field: keyof typeof estimateForm, value: string | number) => {
    setEstimateForm((current) => ({ ...current, [field]: value }));
  };

  const handleEstimate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    estimateMutation.mutate();
  };

  const summary = summaryQuery.isSuccess ? summaryQuery.data : null;
  const costs = costsQuery.isSuccess ? costsQuery.data : null;
  const usage = usageQuery.isSuccess ? usageQuery.data : null;

  return (
    <div className="pt-8">
      <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">운영</p>
          <h1 className="mb-2 text-3xl font-bold text-gray-950 dark:text-white">OpenAI 사용량</h1>
          <p className="max-w-2xl text-gray-600 dark:text-zinc-400">
            OpenAI 비용, completion 사용량, 호출 예상 비용을 조회합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary?.usageDashboardUrl ? (
            <a
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
              href={summary.usageDashboardUrl}
              rel="noreferrer"
              target="_blank"
              title="OpenAI usage dashboard"
            >
              <ExternalLink size={16} />
              Usage
            </a>
          ) : null}
          {summary?.billingUrl ? (
            <a
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition active:scale-[0.98]"
              href={summary.billingUrl}
              rel="noreferrer"
              target="_blank"
              title="OpenAI billing"
            >
              <ExternalLink size={16} />
              Billing
            </a>
          ) : null}
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <SummaryCard icon={KeyRound} label="키 상태" value={summary?.effectiveKeyType || "-"} caption={summary?.keyLabel || "설정 확인"} />
        <SummaryCard icon={DollarSign} label="오늘 비용" value={usd(summary?.todayCostUsd)} caption={summary?.costApiAvailable ? "Costs API" : "조회 불가"} />
        <SummaryCard icon={WalletCards} label="이번 달 비용" value={usd(summary?.monthToDateCostUsd)} caption={`예산 ${usd(summary?.budgetLimitUsd)}`} />
        <SummaryCard icon={Activity} label="잔여 예산" value={usd(summary?.remainingBudgetUsd)} caption={summary?.model || "모델 설정"} />
      </section>

      {summaryQuery.isError ? (
        <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3 text-gray-600 dark:text-zinc-400">
            <Server size={20} />
            <p className="text-sm">OpenAI 운영 정보를 불러오지 못했습니다. 서버 상태와 관리자 키 설정을 확인해 주세요.</p>
          </div>
        </section>
      ) : null}

      {summary?.unavailableReason ? (
        <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          {summary.unavailableReason}
        </section>
      ) : null}

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-lg font-bold text-gray-950 dark:text-white">조회 범위</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">비용과 사용량 조회에 같은 날짜 범위를 사용합니다.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <DateField label="시작일" value={startDate} onChange={setStartDate} />
            <DateField label="종료일" value={endDate} onChange={setEndDate} />
            <TextField label="비용 그룹" value={costGroupBy} onChange={setCostGroupBy} />
            <TextField label="사용량 그룹" value={usageGroupBy} onChange={setUsageGroupBy} />
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">버킷</span>
          <select
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
            value={bucketWidth}
            onChange={(event) => setBucketWidth(event.target.value)}
          >
            <option value="1d">일별</option>
            <option value="1h">시간별</option>
          </select>
        </label>
      </section>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-950 dark:text-white">실제 비용</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{costs ? `합계 ${usd(costs.totalCostUsd)}` : "조회된 비용이 없습니다."}</p>
            </div>
            <button
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
              title="비용 새로고침"
              type="button"
              onClick={() => void costsQuery.refetch()}
            >
              <RefreshCw size={17} />
            </button>
          </div>
          {costs && costs.buckets.length > 0 ? (
            <div className="space-y-3">
              {costs.buckets.map((bucket) => {
                const width = maxBucketCost > 0 ? `${Math.max((bucket.costUsd / maxBucketCost) * 100, 4)}%` : "4%";

                return (
                  <div key={`${bucket.startAt}-${bucket.endAt}`}>
                    <div className="mb-1 flex justify-between gap-3 text-xs text-gray-500 dark:text-zinc-500">
                      <span>{formatDateTime(bucket.startAt)}</span>
                      <span className="font-bold text-gray-700 dark:text-zinc-300">{usd(bucket.costUsd)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                      <div className="h-full rounded-full bg-blue-600" style={{ width }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyPanel label="비용 데이터가 없습니다." />
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-950 dark:text-white">Completion 사용량</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                {usage ? `${integer(usage.totalRequests)}회 · 입력 ${integer(usage.totalInputTokens)} tokens` : "조회된 사용량이 없습니다."}
              </p>
            </div>
            <button
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
              title="사용량 새로고침"
              type="button"
              onClick={() => void usageQuery.refetch()}
            >
              <RefreshCw size={17} />
            </button>
          </div>
          {usage && usage.buckets.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-zinc-950 dark:text-zinc-500">
                  <tr>
                    <th className="px-3 py-2">시간</th>
                    <th className="px-3 py-2">요청</th>
                    <th className="px-3 py-2">입력</th>
                    <th className="px-3 py-2">출력</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {usage.buckets.slice(0, 10).map((bucket) => (
                    <tr key={`${bucket.startAt}-${bucket.endAt}`}>
                      <td className="px-3 py-2 text-gray-600 dark:text-zinc-400">{formatDateTime(bucket.startAt)}</td>
                      <td className="px-3 py-2 font-semibold text-gray-950 dark:text-white">{integer(bucket.requests)}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-zinc-400">{integer(bucket.inputTokens)}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-zinc-400">{integer(bucket.outputTokens)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyPanel label="사용량 데이터가 없습니다." />
          )}
        </section>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex items-center gap-3">
          <Calculator className="text-blue-600" size={22} />
          <div>
            <h2 className="text-lg font-bold text-gray-950 dark:text-white">호출 비용 추정</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">모델과 예상 토큰 수로 호출 1회의 비용을 계산합니다.</p>
          </div>
        </div>
        <form className="grid gap-4" onSubmit={handleEstimate}>
          <div className="grid gap-4 md:grid-cols-4">
            <NumberField label="입력 토큰" value={estimateForm.inputTokens} onChange={(value) => updateEstimate("inputTokens", value)} />
            <NumberField label="캐시 입력" value={estimateForm.cachedInputTokens} onChange={(value) => updateEstimate("cachedInputTokens", value)} />
            <NumberField label="출력 토큰" value={estimateForm.outputTokens} onChange={(value) => updateEstimate("outputTokens", value)} />
            <TextField label="모델" value={estimateForm.model} onChange={(value) => updateEstimate("model", value)} />
          </div>
          <div className="flex justify-end">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={estimateMutation.isPending}
              title="예상 비용 계산"
              type="submit"
            >
              <Calculator size={16} />
              {estimateMutation.isPending ? "계산 중" : "계산"}
            </button>
          </div>
        </form>
        {estimateMutation.data ? (
          <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-500/10 dark:text-blue-100">
            <p className="text-2xl font-bold">{usd(estimateMutation.data.estimatedCostUsd)}</p>
            <p className="mt-1 text-blue-700 dark:text-blue-200">
              과금 입력 {integer(estimateMutation.data.billableInputTokens)} · 출력 {integer(estimateMutation.data.outputTokens)}
            </p>
            <p className="mt-3 text-xs leading-relaxed opacity-80">{estimateMutation.data.pricingNote}</p>
          </div>
        ) : null}
        {estimateMutation.isError ? (
          <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:bg-zinc-950 dark:text-zinc-400">
            예상 비용을 계산하지 못했습니다. 입력값과 서버 상태를 확인해 주세요.
          </p>
        ) : null}
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: typeof KeyRound;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-gray-950 dark:text-white">{value}</p>
      <p className="text-sm font-semibold text-gray-600 dark:text-zinc-300">{label}</p>
      <p className="mt-1 truncate text-xs text-gray-500 dark:text-zinc-500">{caption}</p>
    </article>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">{label}</span>
      <input
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">{label}</span>
      <input
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">{label}</span>
      <input
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
        min={0}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-500 dark:border-zinc-800 dark:text-zinc-500">
      {label}
    </div>
  );
}
