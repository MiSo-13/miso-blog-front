import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  Edit3,
  FileText,
  Github,
  ListChecks,
  PlusCircle,
  Save,
  ShieldAlert,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AiJobStatusPanel from "../components/AiJobStatusPanel";
import { EmptyState, Notice } from "../components/StateBlock";
import { api } from "../lib/api";
import { formatDateTime, statusLabel } from "../lib/format";
import type {
  AnalyzeGitRepositoryPayload,
  CreateBlogPostFromAnalysisPayload,
  CreateGitRepositoryPayload,
  GitAnalysisReport,
  GitRepository,
  UpdateGitRepositoryPayload,
  WriteBlogPostFromAnalysisPayload,
} from "../types/api";

const emptyForm = {
  repositoryFullName: "",
  defaultBranch: "main",
  description: "",
  active: true,
};

const defaultAnalysisForm = {
  commitLimit: 20,
  analyzeAllCommits: false,
  focus: "",
  createBlogPost: false,
};

function parseGitAnalysisReport(value: string | null): GitAnalysisReport | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as GitAnalysisReport;
  } catch {
    return null;
  }
}

export default function GitRepositories() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const repositoriesQuery = useQuery({
    queryKey: ["git-repositories"],
    queryFn: api.gitRepositories,
    retry: false,
  });
  const createRepositoryMutation = useMutation({
    mutationFn: (payload: CreateGitRepositoryPayload) => api.createGitRepository(payload),
    onSuccess: () => {
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["git-repositories"] });
    },
  });

  const repositories = repositoriesQuery.isSuccess ? repositoriesQuery.data : [];
  const canCreate = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(form.repositoryFullName.trim());

  const updateField = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate) {
      return;
    }

    createRepositoryMutation.mutate({
      repositoryFullName: form.repositoryFullName.trim(),
      defaultBranch: form.defaultBranch.trim() || null,
      description: form.description.trim() || null,
      active: form.active,
    });
  };

  return (
    <div className="pt-8">
      <section className="mb-8">
        <p className="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">GitHub 저장소</p>
        <h1 className="mb-2 text-3xl font-bold text-gray-950 dark:text-white">GitHub 분석</h1>
        <p className="max-w-2xl text-gray-600 dark:text-zinc-400">
          연결된 GitHub 저장소의 커밋 흐름을 분석해 블로그 초안으로 이어갈 수 있습니다.
        </p>
      </section>

      <section className="mb-8">
        <Notice
          description="GitHub API로 읽은 커밋 요약과 패치 맥락을 서버의 AI 분석 흐름에 사용합니다. private 저장소나 민감한 코드가 포함된 경우에는 로컬 Git 분석을 먼저 사용하는 것을 권장합니다."
          icon={ShieldAlert}
          title="분석 범위 확인"
          tone="blue"
        />
      </section>

      <section className="mb-8">
        <Notice
          description="활성화된 개발 레퍼런스 URL과 이전 저장 글의 문체 흐름이 AI 기반 글 작성에 함께 참고됩니다."
          icon={BookOpen}
          title="레퍼런스 자동 참고"
          tone="blue"
        />
      </section>

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex items-center gap-3">
          <PlusCircle className="text-blue-600" size={22} />
          <h2 className="text-xl font-bold text-gray-950 dark:text-white">저장소 등록</h2>
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                저장소
              </span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                placeholder="owner/repo"
                value={form.repositoryFullName}
                onChange={(event) => updateField("repositoryFullName", event.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                기본 브랜치
              </span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                value={form.defaultBranch}
                onChange={(event) => updateField("defaultBranch", event.target.value)}
              />
            </label>
          </div>
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
              title="GitHub 저장소 등록"
              type="submit"
            >
              <PlusCircle size={17} />
              {createRepositoryMutation.isPending ? "등록 중" : "등록"}
            </button>
          </div>
        </form>
      </section>

      {repositories.length === 0 ? (
        <EmptyState
          description="서버가 연결되고 저장소를 등록하면 이곳에 목록이 표시됩니다."
          icon={Github}
          title="등록된 GitHub 저장소가 없습니다"
        />
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {repositories.map((repository) => (
            <RepositoryCard key={repository.id} repository={repository} />
          ))}
        </section>
      )}
    </div>
  );
}

function RepositoryCard({ repository }: { repository: GitRepository }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    repositoryFullName: repository.repositoryFullName,
    defaultBranch: repository.defaultBranch || "main",
    description: repository.description ?? "",
    active: repository.active,
  });
  const [analysisForm, setAnalysisForm] = useState(defaultAnalysisForm);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [analysisJobId, setAnalysisJobId] = useState<number | null>(null);
  const [analysisJobReport, setAnalysisJobReport] = useState<GitAnalysisReport | null>(null);

  const reportsQuery = useQuery({
    queryKey: ["git-repository-reports", repository.id],
    queryFn: () => api.gitRepositoryReports(repository.id),
    retry: false,
  });
  const updateRepositoryMutation = useMutation({
    mutationFn: (payload: UpdateGitRepositoryPayload) => api.updateGitRepository(repository.id, payload),
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["git-repositories"] });
    },
  });
  const analyzeJobMutation = useMutation({
    mutationFn: (payload: AnalyzeGitRepositoryPayload) => api.createGitRepositoryAnalysisJob(repository.id, payload),
    onSuccess: (job) => {
      setAnalysisJobId(job.id);
      setAnalysisJobReport(null);
    },
  });
  const analysisJobQuery = useQuery({
    queryKey: ["ai-job", analysisJobId],
    queryFn: () => api.job(analysisJobId!),
    enabled: analysisJobId !== null,
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PENDING" || status === "RUNNING" ? 2500 : false;
    },
  });
  const retryAnalysisJobMutation = useMutation({
    mutationFn: (jobId: number) => api.retryJob(jobId),
    onSuccess: (job) => {
      setAnalysisJobId(job.id);
      setAnalysisJobReport(null);
    },
  });
  const createDraftMutation = useMutation({
    mutationFn: ({ reportId, payload }: { reportId: number; payload: CreateBlogPostFromAnalysisPayload }) =>
      api.createBlogPostFromGitAnalysis(reportId, payload),
    onSuccess: (blogPost) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      navigate(`/drafts/${blogPost.id}`);
    },
  });
  const writeDraftMutation = useMutation({
    mutationFn: ({ reportId, payload }: { reportId: number; payload: WriteBlogPostFromAnalysisPayload }) =>
      api.writeBlogPostFromGitAnalysis(reportId, payload),
    onSuccess: (blogPost) => {
      queryClient.invalidateQueries({ queryKey: ["git-repository-reports", repository.id] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      navigate(`/drafts/${blogPost.id}`);
    },
  });

  useEffect(() => {
    setEditForm({
      repositoryFullName: repository.repositoryFullName,
      defaultBranch: repository.defaultBranch || "main",
      description: repository.description ?? "",
      active: repository.active,
    });
  }, [repository]);

  useEffect(() => {
    const job = analysisJobQuery.data;
    if (job?.status !== "SUCCEEDED") {
      return;
    }

    const report = parseGitAnalysisReport(job.resultJson);
    if (report) {
      setAnalysisJobReport(report);
      setSelectedReportId(report.id);
      queryClient.invalidateQueries({ queryKey: ["git-repository-reports", repository.id] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    }
  }, [analysisJobQuery.data, queryClient, repository.id]);

  const reports = useMemo(() => {
    const savedReports = reportsQuery.isSuccess ? [...reportsQuery.data].sort((a, b) => b.id - a.id) : [];
    if (!analysisJobReport || savedReports.some((report) => report.id === analysisJobReport.id)) {
      return savedReports;
    }

    return [analysisJobReport, ...savedReports];
  }, [analysisJobReport, reportsQuery.data, reportsQuery.isSuccess]);
  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null;
  const isAnalysisRunning =
    analyzeJobMutation.isPending ||
    analysisJobQuery.data?.status === "PENDING" ||
    analysisJobQuery.data?.status === "RUNNING";

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateRepositoryMutation.mutate({
      repositoryFullName: editForm.repositoryFullName.trim(),
      defaultBranch: editForm.defaultBranch.trim() || null,
      description: editForm.description.trim() || null,
      active: editForm.active,
    });
  };

  const handleAnalyze = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    analyzeJobMutation.mutate({
      commitLimit: analysisForm.analyzeAllCommits ? null : analysisForm.commitLimit,
      analyzeAllCommits: analysisForm.analyzeAllCommits,
      focus: analysisForm.focus.trim() || null,
      createBlogPost: analysisForm.createBlogPost,
    });
  };

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-gray-950 dark:text-white">{repository.repositoryFullName}</h2>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              {repository.active ? "활성" : "비활성"}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
            {repository.description || "설명이 등록되지 않았습니다"}
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-zinc-500">
            {repository.defaultBranch || "main"} · {formatDateTime(repository.updatedAt || repository.createdAt)}
          </p>
        </div>
        <button
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
          title={isEditing ? "수정 닫기" : "저장소 수정"}
          type="button"
          onClick={() => setIsEditing((value) => !value)}
        >
          {isEditing ? <X size={18} /> : <Edit3 size={18} />}
        </button>
      </div>

      {isEditing ? (
        <form className="mb-6 grid gap-3 rounded-lg bg-gray-50 p-4 dark:bg-zinc-950" onSubmit={handleEditSubmit}>
          <input
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
            value={editForm.repositoryFullName}
            onChange={(event) => setEditForm((current) => ({ ...current, repositoryFullName: event.target.value }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
              value={editForm.defaultBranch}
              onChange={(event) => setEditForm((current) => ({ ...current, defaultBranch: event.target.value }))}
            />
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <input
                checked={editForm.active}
                type="checkbox"
                onChange={(event) => setEditForm((current) => ({ ...current, active: event.target.checked }))}
              />
              활성 저장소
            </label>
          </div>
          <textarea
            className="min-h-20 resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
            value={editForm.description}
            onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
          />
          <div className="flex justify-end">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={updateRepositoryMutation.isPending}
              title="수정 저장"
              type="submit"
            >
              <Save size={16} />
              저장
            </button>
          </div>
        </form>
      ) : null}

      <form className="grid gap-4 border-t border-gray-100 pt-5 dark:border-zinc-800" onSubmit={handleAnalyze}>
        <Notice
          description="GitHub API 조회와 OpenAI 분석은 1분 이상 걸릴 수 있어 비동기 작업으로 실행합니다. 화면을 닫아도 AI 작업 화면에서 진행 상태를 다시 확인할 수 있습니다."
          icon={ShieldAlert}
          tone="gray"
        />
        <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">커밋 수</span>
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              disabled={analysisForm.analyzeAllCommits}
              max={300}
              min={1}
              type="number"
              value={analysisForm.commitLimit}
              onChange={(event) =>
                setAnalysisForm((current) => ({ ...current, commitLimit: Number(event.target.value) || 1 }))
              }
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">초점</span>
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              placeholder="강조할 변경 흐름이나 독자 관점"
              value={analysisForm.focus}
              onChange={(event) => setAnalysisForm((current) => ({ ...current, focus: event.target.value }))}
            />
          </label>
        </div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <input
                checked={analysisForm.analyzeAllCommits}
                type="checkbox"
                onChange={(event) =>
                  setAnalysisForm((current) => ({ ...current, analyzeAllCommits: event.target.checked }))
                }
              />
              전체 커밋 분석
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <input
                checked={analysisForm.createBlogPost}
                type="checkbox"
                onChange={(event) => setAnalysisForm((current) => ({ ...current, createBlogPost: event.target.checked }))}
              />
              분석 후 초안 생성
            </label>
            {analysisForm.analyzeAllCommits ? (
              <p className="text-xs leading-5 text-amber-700 dark:text-amber-300">
                전체 분석은 서버 설정 한도 안에서 오래된 commit까지 조회하므로 시간이 더 걸릴 수 있습니다.
              </p>
            ) : null}
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isAnalysisRunning}
            title="GitHub 저장소 분석"
            type="submit"
          >
            <Sparkles size={17} />
            {isAnalysisRunning ? "분석 중" : "분석"}
          </button>
        </div>
      </form>

      <div className="mt-4">
        <AiJobStatusPanel
          job={analysisJobQuery.data}
          isRetrying={retryAnalysisJobMutation.isPending}
          title="GitHub 저장소 분석"
          onRetry={() => {
            if (analysisJobQuery.data?.retryable) {
              retryAnalysisJobMutation.mutate(analysisJobQuery.data.id);
            }
          }}
        />
      </div>

      <ReportPanel
        report={selectedReport}
        reports={reports}
        selectedReportId={selectedReport?.id ?? null}
        isCreatingDraft={createDraftMutation.isPending}
        isWritingDraft={writeDraftMutation.isPending}
        onCreateDraft={(reportId, payload) => createDraftMutation.mutate({ reportId, payload })}
        onSelectReport={setSelectedReportId}
        onWriteDraft={(reportId, payload) => writeDraftMutation.mutate({ reportId, payload })}
      />
    </article>
  );
}

function ReportPanel({
  report,
  reports,
  selectedReportId,
  isCreatingDraft,
  isWritingDraft,
  onCreateDraft,
  onSelectReport,
  onWriteDraft,
}: {
  report: GitAnalysisReport | null;
  reports: GitAnalysisReport[];
  selectedReportId: number | null;
  isCreatingDraft: boolean;
  isWritingDraft: boolean;
  onCreateDraft: (reportId: number, payload: CreateBlogPostFromAnalysisPayload) => void;
  onSelectReport: (reportId: number) => void;
  onWriteDraft: (reportId: number, payload: WriteBlogPostFromAnalysisPayload) => void;
}) {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState("");
  const [writingFocus, setWritingFocus] = useState("");
  const [audience, setAudience] = useState("");
  const [markReviewReady, setMarkReviewReady] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [showDraft, setShowDraft] = useState(false);

  useEffect(() => {
    setSelectedKeywords([]);
    setSelectedTopicTitle("");
    setWritingFocus("");
    setAudience("");
    setMarkReviewReady(false);
    setShowSource(false);
    setShowDraft(false);
  }, [report?.id]);

  if (!report) {
    return (
      <div className="mt-6">
        <EmptyState
          description="분석을 실행하면 결과가 이곳에 표시됩니다."
          icon={ListChecks}
          title="분석 리포트가 없습니다"
          tone="gray"
        />
      </div>
    );
  }

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((current) =>
      current.includes(keyword) ? current.filter((item) => item !== keyword) : [...current, keyword],
    );
  };

  const createDraft = () => {
    onCreateDraft(report.id, {
      title: report.recommendedTitle || null,
      summary: report.analysisSummary || null,
      tags: report.keywords.slice(0, 6),
      markReviewReady,
    });
  };

  const writeDraft = () => {
    onWriteDraft(report.id, {
      selectedKeywords,
      selectedTopicTitle: selectedTopicTitle || null,
      writingFocus: writingFocus.trim() || null,
      audience: audience.trim() || null,
      writingMode: "OPENAI",
      markReviewReady,
    });
  };

  return (
    <section className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-950 dark:text-white">
            <CheckCircle2 className="text-blue-600" size={19} />
            분석 리포트
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">
            {statusLabel(report.status)} · {formatDateTime(report.updatedAt || report.createdAt)}
          </p>
        </div>
        {reports.length > 1 ? (
          <select
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            title="리포트 선택"
            value={selectedReportId ?? report.id}
            onChange={(event) => onSelectReport(Number(event.target.value))}
          >
            {reports.map((item) => (
              <option key={item.id} value={item.id}>
                #{item.id} · {statusLabel(item.status)}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {report.status === "FAILED" ? (
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          분석을 완료하지 못했습니다. GitHub 권한, 저장소 이름, 서버 설정을 확인해 주세요.
        </div>
      ) : (
        <div className="grid gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">추천 제목</p>
            <p className="mt-1 text-base font-semibold text-gray-950 dark:text-white">
              {report.recommendedTitle || "추천 제목이 아직 없습니다"}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">분석 요약</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-zinc-300">
              {report.analysisSummary || "요약이 아직 없습니다"}
            </p>
          </div>
          {report.keywords.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">키워드</p>
              <div className="flex flex-wrap gap-2">
                {report.keywords.map((keyword) => (
                  <button
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      selectedKeywords.includes(keyword)
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    }`}
                    key={keyword}
                    title={`${keyword} 선택`}
                    type="button"
                    onClick={() => toggleKeyword(keyword)}
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {report.topicCandidates.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">글감</p>
              <div className="grid gap-3">
                {report.topicCandidates.map((topic) => (
                  <button
                    className={`rounded-lg border p-4 text-left transition ${
                      selectedTopicTitle === topic.title
                        ? "border-blue-600 bg-white shadow-sm dark:bg-zinc-900"
                        : "border-gray-200 bg-white hover:border-blue-200 dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                    key={topic.title}
                    title="글감 선택"
                    type="button"
                    onClick={() => setSelectedTopicTitle(topic.title)}
                  >
                    <p className="font-semibold text-gray-950 dark:text-white">{topic.title}</p>
                    {topic.angle ? <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">{topic.angle}</p> : null}
                    {topic.reason ? <p className="mt-2 text-xs text-gray-500 dark:text-zinc-500">{topic.reason}</p> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
              placeholder="작성 초점"
              value={writingFocus}
              onChange={(event) => setWritingFocus(event.target.value)}
            />
            <input
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
              placeholder="대상 독자"
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
            />
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <input checked={markReviewReady} type="checkbox" onChange={(event) => setMarkReviewReady(event.target.checked)} />
              검토 대기로 표시
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                disabled={isCreatingDraft}
                title="리포트 내용으로 초안 생성"
                type="button"
                onClick={createDraft}
              >
                <FileText size={16} />
                초안
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
                disabled={isWritingDraft}
                title="선택한 키워드와 글감으로 작성"
                type="button"
                onClick={writeDraft}
              >
                <Wand2 size={16} />
                작성
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-4 dark:border-zinc-800">
            <button
              className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-white hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-900"
              title="분석 근거 보기"
              type="button"
              onClick={() => setShowSource((value) => !value)}
            >
              근거 {showSource ? "닫기" : "보기"}
            </button>
            <button
              className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-white hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-900"
              title="초안 원문 보기"
              type="button"
              onClick={() => setShowDraft((value) => !value)}
            >
              원문 {showDraft ? "닫기" : "보기"}
            </button>
          </div>
          {showSource ? (
            <pre className="max-h-80 overflow-auto rounded-lg bg-white p-4 text-xs leading-6 text-gray-700 dark:bg-zinc-900 dark:text-zinc-300">
              {report.sourceSummary || "분석 근거가 없습니다"}
            </pre>
          ) : null}
          {showDraft ? (
            <pre className="max-h-80 overflow-auto rounded-lg bg-white p-4 text-xs leading-6 text-gray-700 dark:bg-zinc-900 dark:text-zinc-300">
              {report.draftMarkdown || "초안 원문이 없습니다"}
            </pre>
          ) : null}
        </div>
      )}

      {report.createdBlogPostId ? (
        <div className="mt-5 rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-green-800 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-200">
          생성된 초안이 있습니다.{" "}
          <Link className="font-bold underline" to={`/drafts/${report.createdBlogPostId}`}>
            초안 열기
          </Link>
        </div>
      ) : null}
    </section>
  );
}
