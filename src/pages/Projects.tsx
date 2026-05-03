import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, CheckCircle2, FileText, FolderOpen, PlusCircle, Sparkles, Wand2 } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { formatDateTime, statusLabel } from "../lib/format";
import type {
  AnalysisReport,
  AnalyzeLocalRepositoryPayload,
  BlogWritingMode,
  CreateLocalRepositoryPayload,
  LocalRepositoryDefault,
  LocalRepository,
  LocalRepositoryAnalysisMode,
  WriteBlogPostFromAnalysisPayload,
} from "../types/api";

const emptyForm = {
  name: "",
  localPath: "",
  defaultBranch: "main",
  description: "",
  active: true,
};

const defaultAnalysisForm = {
  commitLimit: 20,
  includeUncommittedChanges: true,
  analysisMode: "LOCAL_ONLY" as LocalRepositoryAnalysisMode,
  focus: "",
  createBlogPost: false,
};

export default function Projects() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const defaultsQuery = useQuery({
    queryKey: ["local-repository-defaults"],
    queryFn: api.localRepositoryDefaults,
    retry: false,
  });
  const repositoriesQuery = useQuery({
    queryKey: ["local-repositories"],
    queryFn: api.localRepositories,
    retry: false,
  });
  const createRepositoryMutation = useMutation({
    mutationFn: (payload: CreateLocalRepositoryPayload) => api.createLocalRepository(payload),
    onSuccess: () => {
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["local-repository-defaults"] });
      queryClient.invalidateQueries({ queryKey: ["local-repositories"] });
    },
  });
  const defaultRepositories = defaultsQuery.isSuccess ? defaultsQuery.data : [];
  const repositories = repositoriesQuery.isSuccess ? repositoriesQuery.data : [];
  const canCreate = form.name.trim().length > 0 && form.localPath.trim().length > 0;

  const updateField = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const applyDefaultRepository = (repository: LocalRepositoryDefault) => {
    setForm({
      name: repository.name,
      localPath: repository.normalizedLocalPath || repository.localPath,
      defaultBranch: repository.defaultBranch || "main",
      description: repository.description ?? "",
      active: repository.active,
    });
  };

  const registerDefaultRepository = (repository: LocalRepositoryDefault) => {
    if (!repository.readable || repository.registered) {
      return;
    }

    createRepositoryMutation.mutate({
      name: repository.name,
      localPath: repository.normalizedLocalPath || repository.localPath,
      defaultBranch: repository.defaultBranch || null,
      description: repository.description ?? null,
      active: repository.active,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate) {
      return;
    }

    createRepositoryMutation.mutate({
      name: form.name.trim(),
      localPath: form.localPath.trim(),
      defaultBranch: form.defaultBranch.trim() || null,
      description: form.description.trim() || null,
      active: form.active,
    });
  };

  return (
    <div className="pt-8">
      <section className="mb-8">
        <p className="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">로컬 Git 저장소</p>
        <h1 className="mb-2 text-3xl font-bold text-gray-950 dark:text-white">프로젝트</h1>
        <p className="max-w-2xl text-gray-600 dark:text-zinc-400">
          로컬 저장소를 등록하면 서버가 커밋 기록과 구현 맥락을 분석해 글감으로 정리합니다.
        </p>
      </section>

      {defaultRepositories.length > 0 ? (
        <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex items-center gap-3">
            <FolderOpen className="text-blue-600" size={22} />
            <div>
              <h2 className="text-xl font-bold text-gray-950 dark:text-white">서버 기본 후보</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                서버 설정에 등록된 로컬 저장소 후보를 바로 등록할 수 있습니다.
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {defaultRepositories.map((repository) => (
              <DefaultRepositoryCard
                key={`${repository.name}-${repository.normalizedLocalPath || repository.localPath}`}
                repository={repository}
                isSubmitting={createRepositoryMutation.isPending}
                onApply={applyDefaultRepository}
                onRegister={registerDefaultRepository}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex items-center gap-3">
          <PlusCircle className="text-blue-600" size={22} />
          <h2 className="text-xl font-bold text-gray-950 dark:text-white">저장소 등록</h2>
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
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">기본 브랜치</span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                value={form.defaultBranch}
                onChange={(event) => updateField("defaultBranch", event.target.value)}
              />
            </label>
          </div>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">로컬 경로</span>
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={form.localPath}
              onChange={(event) => updateField("localPath", event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">설명</span>
            <textarea
              className="min-h-20 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </label>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <input checked={form.active} type="checkbox" onChange={(event) => updateField("active", event.target.checked)} />
              활성 저장소
            </label>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canCreate || createRepositoryMutation.isPending}
              title="저장소 등록"
              type="submit"
            >
              <PlusCircle size={17} />
              {createRepositoryMutation.isPending ? "등록 중" : "등록"}
            </button>
          </div>
        </form>
      </section>

      {repositories.length === 0 ? (
        <section className="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <FolderOpen className="mx-auto mb-4 text-blue-600" size={34} />
          <h2 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">등록된 저장소가 없습니다</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-600 dark:text-zinc-400">
            서버가 연결되고 저장소를 등록하면 이곳에 목록이 표시됩니다.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {repositories.map((repository) => (
            <RepositoryCard key={repository.id} repository={repository} />
          ))}
        </section>
      )}
    </div>
  );
}

function DefaultRepositoryCard({
  repository,
  isSubmitting,
  onApply,
  onRegister,
}: {
  repository: LocalRepositoryDefault;
  isSubmitting: boolean;
  onApply: (repository: LocalRepositoryDefault) => void;
  onRegister: (repository: LocalRepositoryDefault) => void;
}) {
  const canRegister = repository.readable && !repository.registered;
  const path = repository.normalizedLocalPath || repository.localPath;

  return (
    <article className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-gray-950 dark:text-white">{repository.name}</h3>
          <p className="mt-1 break-all text-xs leading-relaxed text-gray-500 dark:text-zinc-500">{path}</p>
        </div>
        {repository.registered ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 size={12} />
            등록됨
          </span>
        ) : null}
      </div>
      {repository.message ? (
        <p className="mb-3 text-xs leading-relaxed text-gray-600 dark:text-zinc-400">{repository.message}</p>
      ) : null}
      <div className="mb-4 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-zinc-500">
        <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-gray-200 dark:bg-zinc-900 dark:ring-zinc-800">
          {repository.defaultBranch || "main"}
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-gray-200 dark:bg-zinc-900 dark:ring-zinc-800">
          {repository.readable ? "읽기 가능" : "확인 필요"}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          title="등록 폼에 채우기"
          type="button"
          onClick={() => onApply(repository)}
        >
          <FileText size={15} />
          채우기
        </button>
        <button
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canRegister || isSubmitting}
          title={repository.registered ? "이미 등록된 저장소" : "기본 후보 등록"}
          type="button"
          onClick={() => onRegister(repository)}
        >
          <PlusCircle size={15} />
          등록
        </button>
      </div>
    </article>
  );
}

function RepositoryCard({ repository }: { repository: LocalRepository }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [analysisForm, setAnalysisForm] = useState(defaultAnalysisForm);
  const reportsQuery = useQuery({
    queryKey: ["local-repository-reports", repository.id],
    queryFn: () => api.localRepositoryReports(repository.id),
    retry: false,
  });
  const analyzeMutation = useMutation({
    mutationFn: (payload: AnalyzeLocalRepositoryPayload) => api.analyzeLocalRepository(repository.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["local-repository-reports", repository.id] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
  const createDraftMutation = useMutation({
    mutationFn: (reportId: number) => api.createBlogPostFromAnalysis(reportId, {}),
    onSuccess: (blogPost) => {
      queryClient.invalidateQueries({ queryKey: ["local-repository-reports", repository.id] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      navigate(`/drafts/${blogPost.id}`);
    },
  });
  const writeDraftMutation = useMutation({
    mutationFn: ({ reportId, payload }: { reportId: number; payload: WriteBlogPostFromAnalysisPayload }) =>
      api.writeBlogPostFromAnalysis(reportId, payload),
    onSuccess: (blogPost) => {
      queryClient.invalidateQueries({ queryKey: ["local-repository-reports", repository.id] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      navigate(`/drafts/${blogPost.id}`);
    },
  });
  const reports = reportsQuery.isSuccess ? reportsQuery.data : [];
  const latestReport = analyzeMutation.data ?? reports[0];

  const updateAnalysisField = (
    field: keyof typeof analysisForm,
    value: string | number | boolean | LocalRepositoryAnalysisMode,
  ) => {
    setAnalysisForm((current) => ({ ...current, [field]: value }));
  };

  const handleAnalyze = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    analyzeMutation.mutate({
      commitLimit: analysisForm.commitLimit,
      includeUncommittedChanges: analysisForm.includeUncommittedChanges,
      analysisMode: analysisForm.analysisMode,
      focus: analysisForm.focus.trim() || null,
      createBlogPost: analysisForm.createBlogPost,
    });
  };

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
          <FolderOpen size={22} />
        </div>
        <span className={repository.active ? "text-xs font-bold uppercase text-emerald-600" : "text-xs font-bold uppercase text-gray-400"}>
          {repository.active ? "활성" : "비활성"}
        </span>
      </div>
      <h2 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">{repository.name}</h2>
      <p className="mb-4 break-all text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{repository.localPath}</p>
      {repository.description ? <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{repository.description}</p> : null}
      <div className="grid gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-zinc-800 dark:text-zinc-500">
        <p>
          <span className="font-bold text-gray-700 dark:text-zinc-300">브랜치:</span> {repository.defaultBranch || "-"}
        </p>
        <p>
          <span className="font-bold text-gray-700 dark:text-zinc-300">수정일:</span> {formatDateTime(repository.updatedAt)}
        </p>
      </div>

      <form className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-950" onSubmit={handleAnalyze}>
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="text-blue-600" size={18} />
          <h3 className="text-sm font-bold text-gray-950 dark:text-white">저장소 분석</h3>
        </div>
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">커밋 수</span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                max={50}
                min={1}
                type="number"
                value={analysisForm.commitLimit}
                onChange={(event) => updateAnalysisField("commitLimit", Number(event.target.value))}
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">분석 방식</span>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                value={analysisForm.analysisMode}
                onChange={(event) => updateAnalysisField("analysisMode", event.target.value as LocalRepositoryAnalysisMode)}
              >
                <option value="LOCAL_ONLY">로컬 분석</option>
                <option value="OPENAI">OpenAI</option>
              </select>
            </label>
          </div>
          {analysisForm.analysisMode === "OPENAI" ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              OpenAI 방식은 저장소 맥락을 설정된 AI 모델로 전송합니다.
            </p>
          ) : null}
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">분석 초점</span>
            <textarea
              className="min-h-20 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
              value={analysisForm.focus}
              onChange={(event) => updateAnalysisField("focus", event.target.value)}
            />
          </label>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                <input
                  checked={analysisForm.includeUncommittedChanges}
                  type="checkbox"
                  onChange={(event) => updateAnalysisField("includeUncommittedChanges", event.target.checked)}
                />
                미커밋 변경 포함
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                <input
                  checked={analysisForm.createBlogPost}
                  type="checkbox"
                  onChange={(event) => updateAnalysisField("createBlogPost", event.target.checked)}
                />
                분석 후 초안 생성
              </label>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={analyzeMutation.isPending}
              title="저장소 분석 실행"
              type="submit"
            >
              <Sparkles size={16} />
              {analyzeMutation.isPending ? "분석 중" : "분석"}
            </button>
          </div>
        </div>
      </form>

      <AnalysisReportPanel
        report={latestReport}
        isCreatingDraft={createDraftMutation.isPending}
        isWritingDraft={writeDraftMutation.isPending}
        onCreateDraft={(reportId) => createDraftMutation.mutate(reportId)}
        onWriteDraft={(reportId, payload) => writeDraftMutation.mutate({ reportId, payload })}
      />
    </article>
  );
}

function AnalysisReportPanel({
  report,
  isCreatingDraft,
  isWritingDraft,
  onCreateDraft,
  onWriteDraft,
}: {
  report?: AnalysisReport;
  isCreatingDraft: boolean;
  isWritingDraft: boolean;
  onCreateDraft: (reportId: number) => void;
  onWriteDraft: (reportId: number, payload: WriteBlogPostFromAnalysisPayload) => void;
}) {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState("");
  const [writingFocus, setWritingFocus] = useState("");
  const [audience, setAudience] = useState("");
  const [writingMode, setWritingMode] = useState<BlogWritingMode>("LOCAL_ONLY");
  const [markReviewReady, setMarkReviewReady] = useState(true);

  useEffect(() => {
    setSelectedKeywords([]);
    setSelectedTopicTitle("");
    setWritingFocus("");
    setAudience("");
    setWritingMode("LOCAL_ONLY");
    setMarkReviewReady(true);
  }, [report?.id]);

  if (!report) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-zinc-800 dark:text-zinc-500">
        아직 분석 리포트가 없습니다.
      </div>
    );
  }

  const isComplete = report.status === "SUCCEEDED";
  const canWriteDraft =
    isComplete && (selectedKeywords.length > 0 || selectedTopicTitle.trim().length > 0 || writingFocus.trim().length > 0);

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((current) =>
      current.includes(keyword) ? current.filter((item) => item !== keyword) : [...current, keyword],
    );
  };

  const handleWriteDraft = () => {
    if (!canWriteDraft) {
      return;
    }

    onWriteDraft(report.id, {
      selectedKeywords: selectedKeywords.length > 0 ? selectedKeywords : null,
      selectedTopicTitle: selectedTopicTitle.trim() || null,
      writingFocus: writingFocus.trim() || null,
      audience: audience.trim() || null,
      writingMode,
      markReviewReady,
    });
  };

  return (
    <div className="mt-4 rounded-lg border border-gray-200 p-4 dark:border-zinc-800">
      <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">{statusLabel(report.status)}</p>
          {report.recommendedTitle ? <h3 className="mt-1 font-bold text-gray-950 dark:text-white">{report.recommendedTitle}</h3> : null}
        </div>
        <span className="text-xs text-gray-500 dark:text-zinc-500">{formatDateTime(report.updatedAt)}</span>
      </div>
      {isComplete && report.analysisSummary ? (
        <p className="mb-3 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{report.analysisSummary}</p>
      ) : (
        <p className="mb-3 text-sm leading-relaxed text-gray-500 dark:text-zinc-500">완료된 분석 리포트가 아직 없습니다.</p>
      )}
      {report.keywords.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {report.keywords.map((keyword) => (
            <button
              className={[
                "rounded-full px-2.5 py-1 text-xs font-semibold transition",
                selectedKeywords.includes(keyword)
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:hover:bg-blue-500/20",
              ].join(" ")}
              key={keyword}
              title="키워드 선택"
              type="button"
              onClick={() => toggleKeyword(keyword)}
            >
              {keyword}
            </button>
          ))}
        </div>
      ) : null}
      {report.topicCandidates.length > 0 ? (
        <div className="mb-4 grid gap-2">
          {report.topicCandidates.slice(0, 3).map((topic) => (
            <button
              className={[
                "rounded-lg p-3 text-left transition",
                selectedTopicTitle === topic.title
                  ? "bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-500/10"
                  : "bg-gray-50 hover:bg-gray-100 dark:bg-zinc-950 dark:hover:bg-zinc-900",
              ].join(" ")}
              key={`${report.id}-${topic.title}`}
              title="글감 선택"
              type="button"
              onClick={() => setSelectedTopicTitle((current) => (current === topic.title ? "" : topic.title))}
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{topic.title}</p>
              {topic.angle || topic.reason ? (
                <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-zinc-500">{topic.angle || topic.reason}</p>
              ) : null}
              {topic.sourceFiles && topic.sourceFiles.length > 0 ? (
                <p className="mt-2 break-all text-[11px] leading-relaxed text-gray-400 dark:text-zinc-600">
                  {topic.sourceFiles.slice(0, 3).join(", ")}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
      {isComplete ? (
        <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-3 flex items-center gap-2">
            <Wand2 className="text-blue-600" size={16} />
            <h4 className="text-sm font-bold text-gray-950 dark:text-white">선택 작성</h4>
          </div>
          <div className="grid gap-3">
            <label className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">작성 방향</span>
              <textarea
                className="min-h-16 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                value={writingFocus}
                onChange={(event) => setWritingFocus(event.target.value)}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">독자</span>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">작성 방식</span>
                <select
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                  value={writingMode}
                  onChange={(event) => setWritingMode(event.target.value as BlogWritingMode)}
                >
                  <option value="LOCAL_ONLY">로컬 분석</option>
                  <option value="OPENAI">OpenAI</option>
                </select>
              </label>
            </div>
            {writingMode === "OPENAI" ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                OpenAI 방식은 마스킹된 분석 근거를 외부 AI로 전송합니다.
              </p>
            ) : null}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                <input
                  checked={markReviewReady}
                  type="checkbox"
                  onChange={(event) => setMarkReviewReady(event.target.checked)}
                />
                작성 후 검토 대기
              </label>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canWriteDraft || isWritingDraft}
                title="선택한 내용으로 초안 작성"
                type="button"
                onClick={handleWriteDraft}
              >
                <Wand2 size={16} />
                {isWritingDraft ? "작성 중" : "작성"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        {report.createdBlogPostId ? (
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
            title="초안 열기"
            to={`/drafts/${report.createdBlogPostId}`}
          >
            <FileText size={16} />
            열기
          </Link>
        ) : (
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
            disabled={!isComplete || isCreatingDraft}
            title="분석 리포트로 초안 생성"
            type="button"
            onClick={() => onCreateDraft(report.id)}
          >
            <FileText size={16} />
            {isCreatingDraft ? "생성 중" : "초안 생성"}
          </button>
        )}
      </div>
    </div>
  );
}
