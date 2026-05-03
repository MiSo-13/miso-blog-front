import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, FileText, FolderOpen, PlusCircle, Sparkles } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { formatDateTime } from "../lib/format";
import type {
  AnalysisReport,
  AnalyzeLocalRepositoryPayload,
  CreateLocalRepositoryPayload,
  LocalRepository,
  LocalRepositoryAnalysisMode,
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
  const repositoriesQuery = useQuery({
    queryKey: ["local-repositories"],
    queryFn: api.localRepositories,
    retry: false,
  });
  const createRepositoryMutation = useMutation({
    mutationFn: (payload: CreateLocalRepositoryPayload) => api.createLocalRepository(payload),
    onSuccess: () => {
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["local-repositories"] });
    },
  });
  const repositories = repositoriesQuery.isSuccess ? repositoriesQuery.data : [];
  const canCreate = form.name.trim().length > 0 && form.localPath.trim().length > 0;

  const updateField = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
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
        <p className="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">Local Git repositories</p>
        <h1 className="mb-2 text-3xl font-bold text-gray-950 dark:text-white">Projects</h1>
        <p className="max-w-2xl text-gray-600 dark:text-zinc-400">
          Register local repositories so the server can analyze commit history and implementation context.
        </p>
      </section>

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex items-center gap-3">
          <PlusCircle className="text-blue-600" size={22} />
          <h2 className="text-xl font-bold text-gray-950 dark:text-white">Register repository</h2>
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Name</span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Default branch</span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                value={form.defaultBranch}
                onChange={(event) => updateField("defaultBranch", event.target.value)}
              />
            </label>
          </div>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Local path</span>
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={form.localPath}
              onChange={(event) => updateField("localPath", event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Description</span>
            <textarea
              className="min-h-20 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </label>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <input checked={form.active} type="checkbox" onChange={(event) => updateField("active", event.target.checked)} />
              Active repository
            </label>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canCreate || createRepositoryMutation.isPending}
              type="submit"
            >
              <PlusCircle size={17} />
              {createRepositoryMutation.isPending ? "Registering" : "Register"}
            </button>
          </div>
        </form>
      </section>

      {repositories.length === 0 ? (
        <section className="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <FolderOpen className="mx-auto mb-4 text-blue-600" size={34} />
          <h2 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">No registered repositories</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-600 dark:text-zinc-400">
            Registered local repositories will appear here when the server is available.
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
          {repository.active ? "Active" : "Inactive"}
        </span>
      </div>
      <h2 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">{repository.name}</h2>
      <p className="mb-4 break-all text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{repository.localPath}</p>
      {repository.description ? <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{repository.description}</p> : null}
      <div className="grid gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-zinc-800 dark:text-zinc-500">
        <p>
          <span className="font-bold text-gray-700 dark:text-zinc-300">Branch:</span> {repository.defaultBranch || "-"}
        </p>
        <p>
          <span className="font-bold text-gray-700 dark:text-zinc-300">Updated:</span> {formatDateTime(repository.updatedAt)}
        </p>
      </div>

      <form className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-950" onSubmit={handleAnalyze}>
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="text-blue-600" size={18} />
          <h3 className="text-sm font-bold text-gray-950 dark:text-white">Repository analysis</h3>
        </div>
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Commit limit</span>
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Mode</span>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                value={analysisForm.analysisMode}
                onChange={(event) => updateAnalysisField("analysisMode", event.target.value as LocalRepositoryAnalysisMode)}
              >
                <option value="LOCAL_ONLY">Local only</option>
                <option value="OPENAI">OpenAI</option>
              </select>
            </label>
          </div>
          {analysisForm.analysisMode === "OPENAI" ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              OpenAI mode sends repository context to the configured AI model.
            </p>
          ) : null}
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Focus</span>
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
                Include uncommitted changes
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                <input
                  checked={analysisForm.createBlogPost}
                  type="checkbox"
                  onChange={(event) => updateAnalysisField("createBlogPost", event.target.checked)}
                />
                Create draft after analysis
              </label>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={analyzeMutation.isPending}
              type="submit"
            >
              <Sparkles size={16} />
              {analyzeMutation.isPending ? "Analyzing" : "Analyze"}
            </button>
          </div>
        </div>
      </form>

      <AnalysisReportPanel
        report={latestReport}
        isCreatingDraft={createDraftMutation.isPending}
        onCreateDraft={(reportId) => createDraftMutation.mutate(reportId)}
      />
    </article>
  );
}

function AnalysisReportPanel({
  report,
  isCreatingDraft,
  onCreateDraft,
}: {
  report?: AnalysisReport;
  isCreatingDraft: boolean;
  onCreateDraft: (reportId: number) => void;
}) {
  if (!report) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-zinc-800 dark:text-zinc-500">
        No analysis report yet.
      </div>
    );
  }

  const isComplete = report.status === "SUCCEEDED";

  return (
    <div className="mt-4 rounded-lg border border-gray-200 p-4 dark:border-zinc-800">
      <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">{report.status}</p>
          {report.recommendedTitle ? <h3 className="mt-1 font-bold text-gray-950 dark:text-white">{report.recommendedTitle}</h3> : null}
        </div>
        <span className="text-xs text-gray-500 dark:text-zinc-500">{formatDateTime(report.updatedAt)}</span>
      </div>
      {isComplete && report.analysisSummary ? (
        <p className="mb-3 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{report.analysisSummary}</p>
      ) : (
        <p className="mb-3 text-sm leading-relaxed text-gray-500 dark:text-zinc-500">Analysis has not produced a completed report.</p>
      )}
      {report.keywords.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {report.keywords.map((keyword) => (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" key={keyword}>
              {keyword}
            </span>
          ))}
        </div>
      ) : null}
      {report.topicCandidates.length > 0 ? (
        <div className="mb-4 grid gap-2">
          {report.topicCandidates.slice(0, 3).map((topic) => (
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-zinc-950" key={`${report.id}-${topic.title}`}>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{topic.title}</p>
              {topic.angle || topic.reason ? (
                <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-zinc-500">{topic.angle || topic.reason}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        {report.createdBlogPostId ? (
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
            to={`/drafts/${report.createdBlogPostId}`}
          >
            <FileText size={16} />
            Open draft
          </Link>
        ) : (
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
            disabled={!isComplete || isCreatingDraft}
            type="button"
            onClick={() => onCreateDraft(report.id)}
          >
            <FileText size={16} />
            {isCreatingDraft ? "Creating draft" : "Create draft"}
          </button>
        )}
      </div>
    </div>
  );
}
