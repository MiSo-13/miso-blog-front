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

export type BlogPostStatus = "DRAFT" | "REVIEW_READY" | "APPROVED" | "PUBLISHED" | "FAILED";

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

export type UpdateBlogPostPayload = {
  title: string;
  slug?: string | null;
  summary?: string | null;
  contentMarkdown: string;
  tags: string[];
  sourceNote?: string | null;
};

export type CreateBlogPostPayload = UpdateBlogPostPayload;

export type BlogPostQualityReviewPayload = {
  originalInputMemo?: string | null;
  targetReader?: string | null;
  monetizationGoal?: string | null;
};

export type BlogPostQualityReview = {
  blogPostId: number;
  verdict: string;
  humanNaturalnessScore: number;
  factualGroundingScore: number;
  readabilityScore: number;
  seoReadinessScore: number;
  monetizationReadinessScore: number;
  publishReady: boolean;
  strengths: string[];
  issues: string[];
  unsupportedClaims: string[];
  aiLikePhrases: string[];
  monetizationSuggestions: string[];
  revisionInstruction: string;
  rawResponse: string;
  modelName: string;
};

export type BlogPostRevisionPayload = {
  revisionInstruction: string;
  additionalMemo?: string | null;
  tone?: string | null;
  targetLength?: "SHORT" | "MEDIUM" | "LONG" | null;
  preserveTitle?: boolean | null;
  preserveTags?: boolean | null;
  markReviewReady?: boolean | null;
};

export type BlogPostQualityImprovePayload = {
  reviewRequest?: BlogPostQualityReviewPayload | null;
  maxRevisionRounds?: number | null;
  minimumHumanNaturalnessScore?: number | null;
  minimumFactualGroundingScore?: number | null;
  minimumReadabilityScore?: number | null;
  minimumSeoReadinessScore?: number | null;
  minimumMonetizationReadinessScore?: number | null;
  additionalRevisionMemo?: string | null;
  tone?: string | null;
  targetLength?: "SHORT" | "MEDIUM" | "LONG" | null;
  preserveTitle?: boolean | null;
  preserveTags?: boolean | null;
  requirePublishReady?: boolean | null;
  markReviewReadyWhenPassed?: boolean | null;
};

export type PublishGithubPagesPayload = {
  targetId?: number | null;
  commitMessage?: string | null;
};

export type PublishGithubPagesResult = {
  blogPostId: number;
  status: string;
  targetId: number | null;
  repositoryFullName: string;
  branchName: string;
  filePath: string;
  commitSha: string;
  commitUrl: string;
  contentUrl: string;
  expectedPublicUrl: string;
};

export type ExportVelogPayload = {
  targetId?: number | null;
  canonicalUrl?: string | null;
  includeCanonicalLink?: boolean | null;
  includeSourceNote?: boolean | null;
};

export type ExportVelogResult = {
  blogPostId: number;
  targetId: number | null;
  targetName: string | null;
  title: string;
  summary: string | null;
  tags: string[];
  markdown: string;
  canonicalUrl: string | null;
  guide: string;
};

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
  createdAt?: string;
  updatedAt?: string;
};

export type CreateLocalRepositoryPayload = {
  name: string;
  localPath: string;
  defaultBranch?: string | null;
  description?: string | null;
  active?: boolean | null;
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
  createdAt?: string;
  updatedAt?: string;
};

export type PublishStrategy = {
  primaryChannel: string;
  exposureChannel: string;
  markdownPolicy: string;
  targets: PublishTarget[];
};
