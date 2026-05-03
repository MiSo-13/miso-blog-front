import axios from "axios";
import type { AxiosResponse } from "axios";
import { notify } from "./notifications";
import type {
  AiJob,
  AnalysisReport,
  AnalyzeGitRepositoryPayload,
  AnalyzeLocalRepositoryPayload,
  ApiResponse,
  BlogMediaAsset,
  BlogMediaBatchUpload,
  BlogPost,
  BlogPostQualityImprovePayload,
  BlogPostQualityReview,
  BlogPostQualityReviewPayload,
  BlogPostRevisionPayload,
  BlogPostSummary,
  BlogPostVersion,
  BlogPostVersionDiff,
  BlogReferenceType,
  BlogReferenceUrl,
  CreatePublishTargetPayload,
  CreateBlogReferenceUrlPayload,
  CreateBlogPostPayload,
  CreateBlogPostFromAnalysisPayload,
  CreateGeneralBlogPostPayload,
  CreateGitRepositoryPayload,
  CreateLocalRepositoryPayload,
  ExportVelogPayload,
  ExportVelogResult,
  GitAnalysisReport,
  GitRepository,
  HealthResponse,
  LocalRepository,
  LocalRepositoryDefault,
  OpenAiCostChart,
  OpenAiCostsQuery,
  OpenAiEstimate,
  OpenAiEstimateQuery,
  OpenAiSummary,
  OpenAiUsage,
  OpenAiUsageQuery,
  PublishGithubPagesPayload,
  PublishGithubPagesResult,
  GitHubBranchOption,
  GitHubPagesConnectionTest,
  GitHubRepositoryOption,
  PublishStrategy,
  PublishTarget,
  UpdateBlogReferenceUrlPayload,
  UpdateBlogPostPayload,
  UpdateGitRepositoryPayload,
  UpdateLocalRepositoryPayload,
  UpdatePublishTargetPayload,
  WriteBlogPostFromAnalysisPayload,
} from "../types/api";

type ApiFailurePayload = {
  success: false;
  code?: string;
  message?: string;
  occurredAt?: string;
  failure?: {
    message?: string | null;
    detailMessage?: string | null;
    actionGuide?: string | null;
    retryable?: boolean | null;
  } | null;
};

export class ApiClientError extends Error {
  code?: string;
  status?: number;
  detailMessage?: string;
  actionGuide?: string;
  retryable?: boolean;
  dedupeKey: string;
  notified = false;

  constructor({
    message,
    code,
    status,
    detailMessage,
    actionGuide,
    retryable,
    dedupeKey,
  }: {
    message: string;
    code?: string;
    status?: number;
    detailMessage?: string;
    actionGuide?: string;
    retryable?: boolean;
    dedupeKey: string;
  }) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.detailMessage = detailMessage;
    this.actionGuide = actionGuide;
    this.retryable = retryable;
    this.dedupeKey = dedupeKey;
  }
}

function resolveApiBaseUrl() {
  const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

  if (import.meta.env.PROD) {
    const pointsToBrowserLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(configuredBaseUrl);

    if (!configuredBaseUrl || pointsToBrowserLocalhost) {
      return "/";
    }
  }

  return configuredBaseUrl || "http://localhost:8010";
}

export const apiBaseUrl = resolveApiBaseUrl();

export const http = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

function isFailurePayload(payload: unknown): payload is ApiFailurePayload {
  return isRecord(payload) && payload.success === false;
}

function normalizeUrl(url?: string) {
  return url?.replace(/\?.*$/, "") ?? "unknown";
}

function createFailureError(payload: ApiFailurePayload, response: AxiosResponse<unknown>) {
  const failure = payload.failure ?? undefined;

  return new ApiClientError({
    message: failure?.message || payload.message || "요청을 처리하지 못했습니다.",
    code: payload.code,
    status: response.status,
    detailMessage: failure?.detailMessage ?? undefined,
    actionGuide: failure?.actionGuide ?? undefined,
    retryable: failure?.retryable ?? undefined,
    dedupeKey: `${payload.code ?? response.status}:${normalizeUrl(response.config.url)}`,
  });
}

function normalizeError(error: unknown): ApiClientError {
  if (isApiClientError(error)) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const response = error.response;
    const payload = response?.data;

    if (isFailurePayload(payload) && response) {
      return createFailureError(payload, response);
    }

    if (!response) {
      return new ApiClientError({
        message: "서버에 연결할 수 없습니다.",
        detailMessage: "네트워크 연결이 끊겼거나 서버가 아직 준비되지 않았습니다.",
        actionGuide: "서버 컨테이너와 배포 프록시 상태를 확인한 뒤 다시 시도해 주세요.",
        dedupeKey: "server-unreachable",
      });
    }

    return new ApiClientError({
      message: `서버 요청이 실패했습니다. (${response.status})`,
      detailMessage: typeof payload === "string" ? payload : undefined,
      actionGuide: response.status >= 500 ? "서버 로그를 확인한 뒤 잠시 후 다시 시도해 주세요." : undefined,
      status: response.status,
      dedupeKey: `${response.status}:${normalizeUrl(response.config.url)}`,
    });
  }

  return new ApiClientError({
    message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    dedupeKey: "unknown-api-error",
  });
}

function successTitle(method: string, url: string) {
  if (method === "PATCH" && /\/api\/blog-posts\/\d+$/.test(url)) {
    return "글이 저장되었습니다.";
  }
  if (method === "POST" && /\/api\/blog-posts\/draft\/manual$/.test(url)) {
    return "초안이 생성되었습니다.";
  }
  if (method === "POST" && /\/quality-review\/ai$/.test(url)) {
    return "품질 검토가 완료되었습니다.";
  }
  if (method === "POST" && /\/revise\/ai$/.test(url)) {
    return "AI 수정 작업을 시작했습니다.";
  }
  if (method === "POST" && /\/quality-improve\/ai$/.test(url)) {
    return "자동 개선 작업을 시작했습니다.";
  }
  if (method === "POST" && /\/draft\/ai-general$/.test(url)) {
    return "AI 초안 생성 작업을 시작했습니다.";
  }
  if (method === "POST" && /\/review-ready$/.test(url)) {
    return "검토 요청 상태로 변경했습니다.";
  }
  if (method === "POST" && /\/approve$/.test(url)) {
    return "글을 승인했습니다.";
  }
  if (method === "POST" && /\/publish$/.test(url)) {
    return "발행 완료 상태로 변경했습니다.";
  }
  if (method === "POST" && /\/publish\/github-pages$/.test(url)) {
    return "GitHub Pages 발행이 완료되었습니다.";
  }
  if (method === "POST" && /\/export\/velog$/.test(url)) {
    return "Velog 내보내기가 준비되었습니다.";
  }
  if (method === "POST" && /\/api\/media\/images$/.test(url)) {
    return "이미지를 업로드했습니다.";
  }
  if (method === "POST" && /\/api\/media\/images\/batch$/.test(url)) {
    return "이미지 묶음을 업로드했습니다.";
  }
  if (method === "POST" && /\/api\/blog-reference-urls$/.test(url)) {
    return "레퍼런스 URL을 추가했습니다.";
  }
  if (method === "PATCH" && /\/api\/blog-reference-urls\/\d+$/.test(url)) {
    return "레퍼런스 URL을 저장했습니다.";
  }
  if (method === "DELETE" && /\/api\/blog-reference-urls\/\d+$/.test(url)) {
    return "레퍼런스 URL을 삭제했습니다.";
  }
  if (method === "POST" && /\/api\/ai-jobs\/\d+\/retry$/.test(url)) {
    return "작업을 다시 시작했습니다.";
  }
  if (method === "POST" && /\/api\/local-repositories$/.test(url)) {
    return "로컬 저장소를 등록했습니다.";
  }
  if (method === "PATCH" && /\/api\/local-repositories\/\d+$/.test(url)) {
    return "로컬 저장소 설정을 저장했습니다.";
  }
  if (method === "POST" && /\/api\/local-repositories\/\d+\/analyze$/.test(url)) {
    return "로컬 저장소 분석이 완료되었습니다.";
  }
  if (method === "POST" && /\/api\/local-repositories\/analysis-reports\/\d+\/blog-post$/.test(url)) {
    return "분석 기반 초안을 만들었습니다.";
  }
  if (method === "POST" && /\/api\/local-repositories\/analysis-reports\/\d+\/write-blog-post$/.test(url)) {
    return "분석 기반 글 작성을 완료했습니다.";
  }
  if (method === "POST" && /\/api\/git-repositories$/.test(url)) {
    return "GitHub 저장소를 등록했습니다.";
  }
  if (method === "PATCH" && /\/api\/git-repositories\/\d+$/.test(url)) {
    return "GitHub 저장소 설정을 저장했습니다.";
  }
  if (method === "POST" && /\/api\/git-repositories\/\d+\/analyze$/.test(url)) {
    return "GitHub 저장소 분석이 완료되었습니다.";
  }
  if (method === "POST" && /\/api\/ai-jobs\/git-repositories\/\d+\/analyze$/.test(url)) {
    return "GitHub 저장소 분석 작업을 시작했습니다.";
  }
  if (method === "POST" && /\/api\/git-repositories\/analysis-reports\/\d+\/blog-post$/.test(url)) {
    return "GitHub 분석 기반 초안을 만들었습니다.";
  }
  if (method === "POST" && /\/api\/git-repositories\/analysis-reports\/\d+\/write-blog-post$/.test(url)) {
    return "GitHub 분석 기반 글 작성을 완료했습니다.";
  }
  if (method === "POST" && /\/api\/publish-targets\/defaults$/.test(url)) {
    return "기본 발행 대상을 생성했습니다.";
  }
  if (method === "POST" && /\/api\/publish-targets$/.test(url)) {
    return "발행 대상을 추가했습니다.";
  }
  if (method === "PATCH" && /\/api\/publish-targets\/\d+$/.test(url)) {
    return "발행 대상 설정을 저장했습니다.";
  }
  if (method === "POST" && /\/api\/publish-targets\/\d+\/test-github-pages$/.test(url)) {
    return "GitHub Pages 연결을 확인했습니다.";
  }

  return method === "POST" ? "요청을 완료했습니다." : "변경 사항을 저장했습니다.";
}

function notifySuccess(response: AxiosResponse<unknown>) {
  const method = response.config.method?.toUpperCase() ?? "GET";

  if (method === "GET") {
    return;
  }

  const url = normalizeUrl(response.config.url);

  notify({
    tone: "success",
    title: successTitle(method, url),
    dedupeKey: `success:${method}:${url}`,
    dedupeMs: 800,
  });
}

function notifyError(error: ApiClientError) {
  if (error.notified) {
    return;
  }

  error.notified = true;
  notify({
    tone: "error",
    title: error.message,
    message: error.detailMessage,
    actionGuide: error.actionGuide,
    dedupeKey: error.dedupeKey,
    dedupeMs: error.dedupeKey === "server-unreachable" ? 8000 : 3000,
  });
}

async function unwrap<T>(request: Promise<AxiosResponse<ApiResponse<T> | T>>): Promise<T> {
  try {
    const response = await request;
    const payload = response.data;

    if (payload && typeof payload === "object" && "success" in payload) {
      if (payload.success) {
        notifySuccess(response as AxiosResponse<unknown>);
        return payload.data;
      }
      throw createFailureError(payload, response as AxiosResponse<unknown>);
    }

    notifySuccess(response as AxiosResponse<unknown>);
    return payload as T;
  } catch (error) {
    const normalizedError = normalizeError(error);
    notifyError(normalizedError);
    throw normalizedError;
  }
}

export const api = {
  health: () => unwrap<HealthResponse>(http.get("/api/system/health")),
  blogPosts: () => unwrap<BlogPostSummary[]>(http.get("/api/blog-posts")),
  blogPost: (blogPostId: number) => unwrap<BlogPost>(http.get(`/api/blog-posts/${blogPostId}`)),
  blogPostVersions: (blogPostId: number) =>
    unwrap<BlogPostVersion[]>(http.get(`/api/blog-posts/${blogPostId}/versions`)),
  blogPostVersionDiff: (blogPostId: number, fromVersionNo?: number | null, toVersionNo?: number | null) =>
    unwrap<BlogPostVersionDiff>(
      http.get(`/api/blog-posts/${blogPostId}/versions/diff`, {
        params: {
          fromVersionNo: fromVersionNo ?? undefined,
          toVersionNo: toVersionNo ?? undefined,
        },
      }),
    ),
  createManualDraft: (payload: CreateBlogPostPayload) =>
    unwrap<BlogPost>(http.post("/api/blog-posts/draft/manual", payload)),
  updateBlogPost: (blogPostId: number, payload: UpdateBlogPostPayload) =>
    unwrap<BlogPost>(http.patch(`/api/blog-posts/${blogPostId}`, payload)),
  reviewBlogPostQuality: (blogPostId: number, payload: BlogPostQualityReviewPayload) =>
    unwrap<BlogPostQualityReview>(http.post(`/api/blog-posts/${blogPostId}/quality-review/ai`, payload)),
  createRevisionJob: (blogPostId: number, payload: BlogPostRevisionPayload) =>
    unwrap<AiJob>(http.post(`/api/ai-jobs/blog-posts/${blogPostId}/revise/ai`, payload)),
  createQualityImproveJob: (blogPostId: number, payload: BlogPostQualityImprovePayload) =>
    unwrap<AiJob>(http.post(`/api/ai-jobs/blog-posts/${blogPostId}/quality-improve/ai`, payload)),
  createGeneralDraftJob: (payload: CreateGeneralBlogPostPayload) =>
    unwrap<AiJob>(http.post("/api/ai-jobs/blog-posts/draft/ai-general", payload)),
  blogReferenceUrls: (type?: BlogReferenceType | null) =>
    unwrap<BlogReferenceUrl[]>(http.get("/api/blog-reference-urls", { params: { type: type || undefined } })),
  createBlogReferenceUrl: (payload: CreateBlogReferenceUrlPayload) =>
    unwrap<BlogReferenceUrl>(http.post("/api/blog-reference-urls", payload)),
  updateBlogReferenceUrl: (referenceUrlId: number, payload: UpdateBlogReferenceUrlPayload) =>
    unwrap<BlogReferenceUrl>(http.patch(`/api/blog-reference-urls/${referenceUrlId}`, payload)),
  deleteBlogReferenceUrl: (referenceUrlId: number) =>
    unwrap<void>(http.delete(`/api/blog-reference-urls/${referenceUrlId}`)),
  createGitRepositoryAnalysisJob: (repositoryId: number, payload: AnalyzeGitRepositoryPayload) =>
    unwrap<AiJob>(http.post(`/api/ai-jobs/git-repositories/${repositoryId}/analyze`, payload)),
  markReviewReady: (blogPostId: number) =>
    unwrap<BlogPost>(http.post(`/api/blog-posts/${blogPostId}/review-ready`)),
  approveBlogPost: (blogPostId: number) =>
    unwrap<BlogPost>(http.post(`/api/blog-posts/${blogPostId}/approve`)),
  markPublished: (blogPostId: number) =>
    unwrap<BlogPost>(http.post(`/api/blog-posts/${blogPostId}/publish`)),
  publishGithubPages: (blogPostId: number, payload: PublishGithubPagesPayload) =>
    unwrap<PublishGithubPagesResult>(http.post(`/api/blog-posts/${blogPostId}/publish/github-pages`, payload)),
  exportVelog: (blogPostId: number, payload: ExportVelogPayload) =>
    unwrap<ExportVelogResult>(http.post(`/api/blog-posts/${blogPostId}/export/velog`, payload)),
  mediaImages: () => unwrap<BlogMediaAsset[]>(http.get("/api/media/images")),
  mediaImagesByGroup: (uploadGroupId: string) =>
    unwrap<BlogMediaAsset[]>(http.get("/api/media/images/groups", { params: { uploadGroupId } })),
  uploadMediaImage: (file: File, altText?: string | null, note?: string | null) => {
    const formData = new FormData();
    formData.append("file", file);
    if (altText) {
      formData.append("altText", altText);
    }
    if (note) {
      formData.append("note", note);
    }
    return unwrap<BlogMediaAsset>(
      http.post("/api/media/images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },
  uploadMediaImages: (files: File[], altTexts?: Array<string | null>, notes?: Array<string | null>) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    altTexts?.forEach((altText) => formData.append("altTexts", altText ?? ""));
    notes?.forEach((note) => formData.append("notes", note ?? ""));

    return unwrap<BlogMediaBatchUpload>(
      http.post("/api/media/images/batch", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },
  jobs: () => unwrap<AiJob[]>(http.get("/api/ai-jobs")),
  job: (jobId: number) => unwrap<AiJob>(http.get(`/api/ai-jobs/${jobId}`)),
  retryJob: (jobId: number) => unwrap<AiJob>(http.post(`/api/ai-jobs/${jobId}/retry`)),
  localRepositoryDefaults: () =>
    unwrap<LocalRepositoryDefault[]>(http.get("/api/local-repositories/defaults")),
  localRepositories: () => unwrap<LocalRepository[]>(http.get("/api/local-repositories")),
  localRepository: (repositoryId: number) =>
    unwrap<LocalRepository>(http.get(`/api/local-repositories/${repositoryId}`)),
  createLocalRepository: (payload: CreateLocalRepositoryPayload) =>
    unwrap<LocalRepository>(http.post("/api/local-repositories", payload)),
  updateLocalRepository: (repositoryId: number, payload: UpdateLocalRepositoryPayload) =>
    unwrap<LocalRepository>(http.patch(`/api/local-repositories/${repositoryId}`, payload)),
  analyzeLocalRepository: (repositoryId: number, payload: AnalyzeLocalRepositoryPayload) =>
    unwrap<AnalysisReport>(http.post(`/api/local-repositories/${repositoryId}/analyze`, payload)),
  localRepositoryReports: (repositoryId: number) =>
    unwrap<AnalysisReport[]>(http.get(`/api/local-repositories/${repositoryId}/analysis-reports`)),
  localRepositoryReport: (reportId: number) =>
    unwrap<AnalysisReport>(http.get(`/api/local-repositories/analysis-reports/${reportId}`)),
  createBlogPostFromAnalysis: (reportId: number, payload: CreateBlogPostFromAnalysisPayload) =>
    unwrap<BlogPost>(http.post(`/api/local-repositories/analysis-reports/${reportId}/blog-post`, payload)),
  writeBlogPostFromAnalysis: (reportId: number, payload: WriteBlogPostFromAnalysisPayload) =>
    unwrap<BlogPost>(http.post(`/api/local-repositories/analysis-reports/${reportId}/write-blog-post`, payload)),
  gitRepositories: () => unwrap<GitRepository[]>(http.get("/api/git-repositories")),
  gitRepository: (repositoryId: number) =>
    unwrap<GitRepository>(http.get(`/api/git-repositories/${repositoryId}`)),
  createGitRepository: (payload: CreateGitRepositoryPayload) =>
    unwrap<GitRepository>(http.post("/api/git-repositories", payload)),
  updateGitRepository: (repositoryId: number, payload: UpdateGitRepositoryPayload) =>
    unwrap<GitRepository>(http.patch(`/api/git-repositories/${repositoryId}`, payload)),
  analyzeGitRepository: (repositoryId: number, payload: AnalyzeGitRepositoryPayload) =>
    unwrap<GitAnalysisReport>(http.post(`/api/git-repositories/${repositoryId}/analyze`, payload)),
  gitRepositoryReports: (repositoryId: number) =>
    unwrap<GitAnalysisReport[]>(http.get(`/api/git-repositories/${repositoryId}/analysis-reports`)),
  gitRepositoryReport: (reportId: number) =>
    unwrap<GitAnalysisReport>(http.get(`/api/git-repositories/analysis-reports/${reportId}`)),
  createBlogPostFromGitAnalysis: (reportId: number, payload: CreateBlogPostFromAnalysisPayload) =>
    unwrap<BlogPost>(http.post(`/api/git-repositories/analysis-reports/${reportId}/blog-post`, payload)),
  writeBlogPostFromGitAnalysis: (reportId: number, payload: WriteBlogPostFromAnalysisPayload) =>
    unwrap<BlogPost>(http.post(`/api/git-repositories/analysis-reports/${reportId}/write-blog-post`, payload)),
  publishTargets: () => unwrap<PublishTarget[]>(http.get("/api/publish-targets")),
  publishStrategy: () => unwrap<PublishStrategy>(http.get("/api/publish-targets/strategy")),
  githubRepositoryOptions: () =>
    unwrap<GitHubRepositoryOption[]>(http.get("/api/publish-targets/github/repositories")),
  githubBranchOptions: (repositoryFullName: string) =>
    unwrap<GitHubBranchOption[]>(http.get("/api/publish-targets/github/branches", { params: { repositoryFullName } })),
  createPublishTarget: (payload: CreatePublishTargetPayload) =>
    unwrap<PublishTarget>(http.post("/api/publish-targets", payload)),
  updatePublishTarget: (targetId: number, payload: UpdatePublishTargetPayload) =>
    unwrap<PublishTarget>(http.patch(`/api/publish-targets/${targetId}`, payload)),
  testGithubPagesTarget: (targetId: number) =>
    unwrap<GitHubPagesConnectionTest>(http.post(`/api/publish-targets/${targetId}/test-github-pages`)),
  createDefaultPublishTargets: () =>
    unwrap<PublishTarget[]>(http.post("/api/publish-targets/defaults")),
  openAiSummary: () => unwrap<OpenAiSummary>(http.get("/api/admin/openai/summary")),
  openAiCosts: (query: OpenAiCostsQuery) =>
    unwrap<OpenAiCostChart>(
      http.get("/api/admin/openai/costs", {
        params: {
          startDate: query.startDate || undefined,
          endDate: query.endDate || undefined,
          groupBy: query.groupBy || undefined,
        },
      }),
    ),
  openAiUsage: (query: OpenAiUsageQuery) =>
    unwrap<OpenAiUsage>(
      http.get("/api/admin/openai/usage/completions", {
        params: {
          startDate: query.startDate || undefined,
          endDate: query.endDate || undefined,
          bucketWidth: query.bucketWidth || undefined,
          groupBy: query.groupBy || undefined,
        },
      }),
    ),
  openAiEstimate: (query: OpenAiEstimateQuery) =>
    unwrap<OpenAiEstimate>(
      http.get("/api/admin/openai/estimate", {
        params: {
          model: query.model || undefined,
          inputTokens: query.inputTokens ?? undefined,
          cachedInputTokens: query.cachedInputTokens ?? undefined,
          outputTokens: query.outputTokens ?? undefined,
        },
      }),
    ),
};
