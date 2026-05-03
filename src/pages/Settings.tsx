import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Github, Globe2, Loader2, PlusCircle, Save, TestTube2 } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatDateTime } from "../lib/format";
import type { CreatePublishTargetPayload, GitHubPagesConnectionTest, PublishTarget, UpdatePublishTargetPayload } from "../types/api";

const channelIcon = {
  GITHUB_PAGES: Github,
  VELOG: Globe2,
};

type TargetForm = {
  role: "PRIMARY" | "SECONDARY";
  name: string;
  baseUrl: string;
  repositoryFullName: string;
  branchName: string;
  contentRootPath: string;
  customDomain: string;
  active: boolean;
};

type CreateTargetForm = TargetForm & {
  channel: PublishTarget["channel"];
};

const emptyCreateForm: CreateTargetForm = {
  channel: "GITHUB_PAGES",
  role: "PRIMARY",
  name: "",
  baseUrl: "",
  repositoryFullName: "",
  branchName: "",
  contentRootPath: "_posts",
  customDomain: "",
  active: true,
};

function toForm(target: PublishTarget): TargetForm {
  return {
    role: target.role,
    name: target.name,
    baseUrl: target.baseUrl ?? "",
    repositoryFullName: target.repositoryFullName ?? "",
    branchName: target.branchName ?? "",
    contentRootPath: target.contentRootPath ?? "",
    customDomain: target.customDomain ?? "",
    active: target.active,
  };
}

function toPayload(form: TargetForm): UpdatePublishTargetPayload {
  return {
    role: form.role,
    name: form.name.trim(),
    baseUrl: form.baseUrl.trim() || null,
    repositoryFullName: form.repositoryFullName.trim() || null,
    branchName: form.branchName.trim() || null,
    contentRootPath: form.contentRootPath.trim() || null,
    customDomain: form.customDomain.trim() || null,
    active: form.active,
  };
}

function toCreatePayload(form: CreateTargetForm): CreatePublishTargetPayload {
  return {
    channel: form.channel,
    ...toPayload(form),
  };
}

function channelLabel(channel: PublishTarget["channel"]) {
  return channel === "GITHUB_PAGES" ? "GitHub Pages" : "Velog";
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
  const repositoriesQuery = useQuery({
    queryKey: ["github-repository-options"],
    queryFn: api.githubRepositoryOptions,
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
  const repositories = repositoriesQuery.isSuccess ? repositoriesQuery.data : [];

  return (
    <div className="pt-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-950 dark:text-white">설정</h1>
          <p className="text-gray-600 dark:text-zinc-400">발행 대상과 작업 공간 설정을 관리합니다.</p>
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

      <CreatePublishTargetSection repositories={repositories} />

      {targets.length === 0 ? (
        <section className="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Globe2 className="mx-auto mb-4 text-blue-600" size={34} />
          <h2 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">발행 대상이 없습니다</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-600 dark:text-zinc-400">
            서버가 연결되면 기본 발행 대상을 만들고 GitHub Pages와 Velog 설정을 저장할 수 있습니다.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {targets.map((target) => (
            <PublishTargetCard
              key={target.id}
              repositories={repositories}
              target={target}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CreatePublishTargetSection({
  repositories,
}: {
  repositories: Array<{ fullName: string; defaultBranch: string; githubPagesCandidate: boolean }>;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateTargetForm>(emptyCreateForm);
  const branchesQuery = useQuery({
    queryKey: ["github-branch-options", "create", form.repositoryFullName],
    queryFn: () => api.githubBranchOptions(form.repositoryFullName),
    enabled: form.channel === "GITHUB_PAGES" && form.repositoryFullName.trim().length > 0,
    retry: false,
  });
  const createMutation = useMutation({
    mutationFn: (payload: CreatePublishTargetPayload) => api.createPublishTarget(payload),
    onSuccess: () => {
      setForm(emptyCreateForm);
      queryClient.invalidateQueries({ queryKey: ["publish-targets"] });
      queryClient.invalidateQueries({ queryKey: ["publish-strategy"] });
    },
  });

  const updateField = (field: keyof CreateTargetForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateChannel = (channel: PublishTarget["channel"]) => {
    setForm((current) => ({
      ...current,
      channel,
      repositoryFullName: channel === "GITHUB_PAGES" ? current.repositoryFullName : "",
      branchName: channel === "GITHUB_PAGES" ? current.branchName : "",
      contentRootPath: channel === "GITHUB_PAGES" ? current.contentRootPath || "_posts" : "",
      customDomain: channel === "GITHUB_PAGES" ? current.customDomain : "",
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      return;
    }

    createMutation.mutate(toCreatePayload(form));
  };

  return (
    <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-center gap-3">
        <PlusCircle className="text-blue-600" size={22} />
        <div>
          <h2 className="text-lg font-bold text-gray-950 dark:text-white">발행 대상 추가</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">GitHub Pages 또는 Velog 발행 대상을 직접 등록합니다.</p>
        </div>
      </div>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">채널</span>
            <select
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={form.channel}
              onChange={(event) => updateChannel(event.target.value as PublishTarget["channel"])}
            >
              <option value="GITHUB_PAGES">GitHub Pages</option>
              <option value="VELOG">Velog</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">이름</span>
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">역할</span>
            <select
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={form.role}
              onChange={(event) => updateField("role", event.target.value)}
            >
              <option value="PRIMARY">주 대상</option>
              <option value="SECONDARY">보조 대상</option>
            </select>
          </label>
        </div>

        {form.channel === "GITHUB_PAGES" ? (
          <>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">GitHub 저장소</span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                list="create-publish-repositories"
                value={form.repositoryFullName}
                onChange={(event) => {
                  const nextRepository = event.target.value;
                  const repository = repositories.find((item) => item.fullName === nextRepository);
                  setForm((current) => ({
                    ...current,
                    repositoryFullName: nextRepository,
                    branchName: repository?.defaultBranch ?? current.branchName,
                  }));
                }}
              />
              <datalist id="create-publish-repositories">
                {repositories.map((repository) => (
                  <option key={repository.fullName} value={repository.fullName}>
                    {repository.githubPagesCandidate ? "GitHub Pages 후보" : repository.defaultBranch}
                  </option>
                ))}
              </datalist>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">브랜치</span>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                  list="create-publish-branches"
                  value={form.branchName}
                  onChange={(event) => updateField("branchName", event.target.value)}
                />
                <datalist id="create-publish-branches">
                  {(branchesQuery.isSuccess ? branchesQuery.data : []).map((branch) => (
                    <option key={branch.name} value={branch.name}>
                      {branch.protectedBranch ? "보호 브랜치" : branch.commitSha}
                    </option>
                  ))}
                </datalist>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">콘텐츠 경로</span>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                  value={form.contentRootPath}
                  onChange={(event) => updateField("contentRootPath", event.target.value)}
                />
              </label>
            </div>
          </>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">기본 URL</span>
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={form.baseUrl}
              onChange={(event) => updateField("baseUrl", event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">커스텀 도메인</span>
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={form.customDomain}
              onChange={(event) => updateField("customDomain", event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-gray-100 pt-4 dark:border-zinc-800 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
            <input checked={form.active} type="checkbox" onChange={(event) => updateField("active", event.target.checked)} />
            활성화
          </label>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!form.name.trim() || createMutation.isPending}
            title="발행 대상 추가"
            type="submit"
          >
            {createMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <PlusCircle size={16} />}
            {createMutation.isPending ? "추가 중" : "추가"}
          </button>
        </div>
      </form>
      {createMutation.isError ? (
        <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:bg-zinc-950 dark:text-zinc-400">
          발행 대상을 추가하지 못했습니다. 설정값과 서버 상태를 확인해 주세요.
        </p>
      ) : null}
    </section>
  );
}

function PublishTargetCard({
  target,
  repositories,
}: {
  target: PublishTarget;
  repositories: Array<{ fullName: string; defaultBranch: string; githubPagesCandidate: boolean }>;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TargetForm>(() => toForm(target));
  const [testResult, setTestResult] = useState<GitHubPagesConnectionTest | null>(null);
  const Icon = channelIcon[target.channel];

  useEffect(() => {
    setForm(toForm(target));
    setTestResult(null);
  }, [target]);

  const branchesQuery = useQuery({
    queryKey: ["github-branch-options", form.repositoryFullName],
    queryFn: () => api.githubBranchOptions(form.repositoryFullName),
    enabled: target.channel === "GITHUB_PAGES" && form.repositoryFullName.trim().length > 0,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdatePublishTargetPayload) => api.updatePublishTarget(target.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publish-targets"] });
      queryClient.invalidateQueries({ queryKey: ["publish-strategy"] });
    },
  });

  const testMutation = useMutation({
    mutationFn: () => api.testGithubPagesTarget(target.id),
    onSuccess: (result) => setTestResult(result),
  });

  const updateField = (field: keyof TargetForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      return;
    }
    updateMutation.mutate(toPayload(form));
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
            <Icon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-950 dark:text-white">{channelLabel(target.channel)}</h2>
            <p className="text-xs text-gray-500 dark:text-zinc-500">수정일 {formatDateTime(target.updatedAt)}</p>
          </div>
        </div>
        <span className={form.active ? "text-xs font-bold uppercase text-emerald-600" : "text-xs font-bold uppercase text-gray-400"}>
          {form.active ? "활성" : "비활성"}
        </span>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">이름</span>
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">역할</span>
            <select
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={form.role}
              onChange={(event) => updateField("role", event.target.value)}
            >
              <option value="PRIMARY">주 대상</option>
              <option value="SECONDARY">보조 대상</option>
            </select>
          </label>
        </div>

        {target.channel === "GITHUB_PAGES" ? (
          <>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">GitHub 저장소</span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                list={`repositories-${target.id}`}
                value={form.repositoryFullName}
                onChange={(event) => {
                  const nextRepository = event.target.value;
                  const repository = repositories.find((item) => item.fullName === nextRepository);
                  setForm((current) => ({
                    ...current,
                    repositoryFullName: nextRepository,
                    branchName: repository?.defaultBranch ?? current.branchName,
                  }));
                }}
              />
              <datalist id={`repositories-${target.id}`}>
                {repositories.map((repository) => (
                  <option key={repository.fullName} value={repository.fullName}>
                    {repository.githubPagesCandidate ? "GitHub Pages 후보" : repository.defaultBranch}
                  </option>
                ))}
              </datalist>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">브랜치</span>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                  list={`branches-${target.id}`}
                  value={form.branchName}
                  onChange={(event) => updateField("branchName", event.target.value)}
                />
                <datalist id={`branches-${target.id}`}>
                  {(branchesQuery.isSuccess ? branchesQuery.data : []).map((branch) => (
                    <option key={branch.name} value={branch.name}>
                      {branch.protectedBranch ? "보호 브랜치" : branch.commitSha}
                    </option>
                  ))}
                </datalist>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">콘텐츠 경로</span>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                  value={form.contentRootPath}
                  onChange={(event) => updateField("contentRootPath", event.target.value)}
                />
              </label>
            </div>
          </>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">기본 URL</span>
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={form.baseUrl}
              onChange={(event) => updateField("baseUrl", event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">커스텀 도메인</span>
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={form.customDomain}
              onChange={(event) => updateField("customDomain", event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-gray-100 pt-4 dark:border-zinc-800 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
            <input checked={form.active} type="checkbox" onChange={(event) => updateField("active", event.target.checked)} />
            활성화
          </label>
          <div className="flex flex-wrap gap-2">
            {target.channel === "GITHUB_PAGES" ? (
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
                disabled={testMutation.isPending}
                title="GitHub Pages 연결 테스트"
                type="button"
                onClick={() => testMutation.mutate()}
              >
                {testMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <TestTube2 size={16} />}
                테스트
              </button>
            ) : null}
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!form.name.trim() || updateMutation.isPending}
              title="발행 대상 저장"
              type="submit"
            >
              {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              저장
            </button>
          </div>
        </div>
      </form>

      {testResult ? (
        <div
          className={
            testResult.success
              ? "mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
              : "mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
          }
        >
          <p className="font-semibold">{testResult.message}</p>
          {testResult.warnings.length > 0 ? <p className="mt-1 text-xs">{testResult.warnings.join(", ")}</p> : null}
          <p className="mt-2 text-xs opacity-80">확인일 {formatDateTime(testResult.checkedAt)}</p>
        </div>
      ) : null}

      {updateMutation.isError || testMutation.isError ? (
        <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:bg-zinc-950 dark:text-zinc-400">
          요청을 완료하지 못했습니다. 설정값과 서버 상태를 확인해 주세요.
        </p>
      ) : null}
    </section>
  );
}
