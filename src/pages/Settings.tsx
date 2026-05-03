import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Github, Globe2, PlusCircle } from "lucide-react";
import { api } from "../lib/api";
import { formatDateTime } from "../lib/format";
import type { PublishTarget } from "../types/api";

const channelIcon = {
  GITHUB_PAGES: Github,
  VELOG: Globe2,
};

function targetDescription(target: PublishTarget) {
  if (target.channel === "GITHUB_PAGES") {
    return [target.repositoryFullName, target.branchName, target.contentRootPath].filter(Boolean).join(" · ");
  }
  return target.baseUrl || target.customDomain || "Velog 내보내기 대상";
}

export default function Settings() {
  const queryClient = useQueryClient();
  const targetsQuery = useQuery({
    queryKey: ["publish-targets"],
    queryFn: api.publishTargets,
    retry: false,
  });
  const strategyQuery = useQuery({
    queryKey: ["publish-strategy"],
    queryFn: api.publishStrategy,
    retry: false,
  });
  const createDefaultsMutation = useMutation({
    mutationFn: api.createDefaultPublishTargets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publish-targets"] });
      queryClient.invalidateQueries({ queryKey: ["publish-strategy"] });
    },
  });
  const targets = targetsQuery.isSuccess ? targetsQuery.data : [];

  return (
    <div className="pt-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-950 dark:text-white">설정</h1>
          <p className="text-gray-600 dark:text-zinc-400">발행 대상과 작업 공간 설정을 확인합니다.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={createDefaultsMutation.isPending}
          title="기본 발행 대상 생성"
          type="button"
          onClick={() => createDefaultsMutation.mutate()}
        >
          <PlusCircle size={17} />
          {createDefaultsMutation.isPending ? "생성 중" : "기본값 생성"}
        </button>
      </div>

      {strategyQuery.isSuccess ? (
        <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-bold text-gray-950 dark:text-white">발행 전략</h2>
          <div className="grid gap-3 text-sm text-gray-600 dark:text-zinc-400 md:grid-cols-3">
            <p>
              <span className="block text-xs font-bold uppercase text-gray-500 dark:text-zinc-500">주 발행</span>
              {strategyQuery.data.primaryChannel}
            </p>
            <p>
              <span className="block text-xs font-bold uppercase text-gray-500 dark:text-zinc-500">노출 채널</span>
              {strategyQuery.data.exposureChannel}
            </p>
            <p>
              <span className="block text-xs font-bold uppercase text-gray-500 dark:text-zinc-500">마크다운</span>
              {strategyQuery.data.markdownPolicy}
            </p>
          </div>
        </section>
      ) : null}

      {targets.length === 0 ? (
        <section className="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Globe2 className="mx-auto mb-4 text-blue-600" size={34} />
          <h2 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">발행 대상이 없습니다</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-600 dark:text-zinc-400">
            서버가 연결되면 기본 발행 대상을 만들고, GitHub Pages와 Velog 세부 정보를 서버에서 설정할 수 있습니다.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {targets.map((target) => {
            const Icon = channelIcon[target.channel];

            return (
              <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900" key={target.id}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                    <Icon size={24} />
                  </div>
                  <span className={target.active ? "text-xs font-bold uppercase text-emerald-600" : "text-xs font-bold uppercase text-gray-400"}>
                    {target.active ? "활성" : "비활성"}
                  </span>
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">{target.name}</h2>
                <p className="mb-5 min-h-10 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{targetDescription(target)}</p>
                <div className="grid gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-zinc-800 dark:text-zinc-500">
                  <p>
                    <span className="font-bold text-gray-700 dark:text-zinc-300">채널:</span> {target.channel}
                  </p>
                  <p>
                    <span className="font-bold text-gray-700 dark:text-zinc-300">역할:</span> {target.role === "PRIMARY" ? "주 대상" : "보조 대상"}
                  </p>
                  <p>
                    <span className="font-bold text-gray-700 dark:text-zinc-300">수정일:</span> {formatDateTime(target.updatedAt)}
                  </p>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
