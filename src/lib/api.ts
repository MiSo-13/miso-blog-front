import axios from "axios";
import type {
  AiJob,
  AnalysisReport,
  AnalyzeGitRepositoryPayload,
  AnalyzeLocalRepositoryPayload,
  ApiResponse,
  BlogMediaAsset,
  BlogPost,
  BlogPostQualityImprovePayload,
  BlogPostQualityReview,
  BlogPostQualityReviewPayload,
  BlogPostRevisionPayload,
  BlogPostSummary,
  BlogPostVersion,
  BlogPostVersionDiff,
  CreatePublishTargetPayload,
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
  UpdateBlogPostPayload,
  UpdateGitRepositoryPayload,
  UpdateLocalRepositoryPayload,
  UpdatePublishTargetPayload,
  WriteBlogPostFromAnalysisPayload,
} from "../types/api";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010";

export const http = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

async function unwrap<T>(request: Promise<{ data: ApiResponse<T> | T }>): Promise<T> {
  const response = await request;
  const payload = response.data;

  if (payload && typeof payload === "object" && "success" in payload) {
    if (payload.success) {
      return payload.data;
    }
    throw new Error(payload.message || "요청에 실패했습니다");
  }

  return payload as T;
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
