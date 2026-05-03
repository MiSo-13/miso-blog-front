export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  code: string;
  message: string;
  occurredAt: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type HealthResponse = {
  status?: string;
  service?: string;
  checkedAt?: string;
};

export type BlogPostStatus = "DRAFT" | "REVIEW_READY" | "APPROVED" | "PUBLISHED";

export type BlogPost = {
  id: number;
  title: string;
  slug?: string;
  summary?: string;
  contentMarkdown: string;
  tags: string[];
  sourceNote?: string | null;
  status: BlogPostStatus;
  currentVersionNo: number;
  approvedAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostSummary = Omit<BlogPost, "contentMarkdown" | "sourceNote" | "approvedAt" | "publishedAt">;

export type AiJobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

export type AiJob = {
  id: number;
  type: string;
  status: AiJobStatus;
  resultBlogPostId: number | null;
  resultJson: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LocalRepository = {
  id: number;
  name: string;
  localPath: string;
  defaultBranch: string;
  description?: string;
  active: boolean;
};

export type AnalysisReport = {
  id: number;
  sourceSummary: string;
  analysisSummary: string;
  keywords: string[];
  topicCandidates: Array<{
    title: string;
    summary?: string;
    sourceFiles?: string[];
  }>;
  recommendedTitle: string;
  draftMarkdown: string;
};

export type PublishTarget = {
  id: number;
  channel: "GITHUB_PAGES" | "VELOG";
  role: "PRIMARY" | "SECONDARY";
  name: string;
  baseUrl?: string;
  repositoryFullName?: string;
  branchName?: string;
  contentRootPath?: string;
  customDomain?: string;
  active: boolean;
};
