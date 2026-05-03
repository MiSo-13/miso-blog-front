import axios from "axios";
import type {
  AiJob,
  AnalysisReport,
  AnalyzeLocalRepositoryPayload,
  ApiResponse,
  BlogPost,
  BlogPostQualityImprovePayload,
  BlogPostQualityReview,
  BlogPostQualityReviewPayload,
  BlogPostRevisionPayload,
  BlogPostSummary,
  CreateBlogPostPayload,
  CreateBlogPostFromAnalysisPayload,
  CreateLocalRepositoryPayload,
  ExportVelogPayload,
  ExportVelogResult,
  HealthResponse,
  LocalRepository,
  PublishGithubPagesPayload,
  PublishGithubPagesResult,
  PublishStrategy,
  PublishTarget,
  UpdateBlogPostPayload,
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
  jobs: () => unwrap<AiJob[]>(http.get("/api/ai-jobs")),
  job: (jobId: number) => unwrap<AiJob>(http.get(`/api/ai-jobs/${jobId}`)),
  localRepositories: () => unwrap<LocalRepository[]>(http.get("/api/local-repositories")),
  createLocalRepository: (payload: CreateLocalRepositoryPayload) =>
    unwrap<LocalRepository>(http.post("/api/local-repositories", payload)),
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
  publishTargets: () => unwrap<PublishTarget[]>(http.get("/api/publish-targets")),
  publishStrategy: () => unwrap<PublishStrategy>(http.get("/api/publish-targets/strategy")),
  createDefaultPublishTargets: () =>
    unwrap<PublishTarget[]>(http.post("/api/publish-targets/defaults")),
};
