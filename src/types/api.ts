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

export type BlogPostVersion = {
  id: number;
  versionNo: number;
  action: string;
  title: string;
  slug?: string | null;
  summary?: string | null;
  contentMarkdown: string;
  tagsJson: string;
  createdAt: string;
};

export type BlogPostVersionDiffLine = {
  type: "INSERT" | "DELETE" | "EQUAL" | string;
  oldLineNo: number | null;
  newLineNo: number | null;
  text: string;
};

export type BlogPostVersionDiffSection = {
  fieldName: string;
  changed: boolean;
  addedLineCount: number;
  deletedLineCount: number;
  lines: BlogPostVersionDiffLine[];
};

export type BlogPostVersionDiff = {
  blogPostId: number;
  fromVersionNo: number;
  toVersionNo: number;
  addedLineCount: number;
  deletedLineCount: number;
  changed: boolean;
  fromVersion: BlogPostVersion;
  toVersion: BlogPostVersion;
  sections: BlogPostVersionDiffSection[];
};

export type UpdateBlogPostPayload = {
  title: string;
  slug?: string | null;
  summary?: string | null;
  contentMarkdown: string;
  tags: string[];
  sourceNote?: string | null;
};

export type CreateBlogPostPayload = UpdateBlogPostPayload;

export type GeneralBlogCategory = "RESTAURANT" | "CAFE" | "TRAVEL" | "PRODUCT_REVIEW" | "DAILY" | "ETC";

export type GeneralBlogLength = "SHORT" | "MEDIUM" | "LONG";

export type GeneralBlogPhotoPayload = {
  url?: string | null;
  description?: string | null;
  placementNote?: string | null;
};

export type CreateGeneralBlogPostPayload = {
  category: GeneralBlogCategory;
  titleHint?: string | null;
  placeName?: string | null;
  addressHint?: string | null;
  requiredPhrases?: string[] | null;
  memo?: string | null;
  keywords?: string[] | null;
  photos?: GeneralBlogPhotoPayload[] | null;
  imagePlacementNotes?: string | null;
  tone?: string | null;
  audience?: string | null;
  targetLength?: GeneralBlogLength | null;
  markReviewReady?: boolean | null;
};

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

export type BlogMediaAsset = {
  id: number;
  originalFilename: string;
  storedFilename: string;
  contentType: string;
  fileSize: number;
  relativePath: string;
  publicUrl: string;
  altText: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiJobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

export type AiJobFailure = {
  code: string;
  message: string | null;
  detailMessage: string | null;
  retryable: boolean;
  actionGuide: string | null;
  failedAt: string | null;
};

export type AiJob = {
  id: number;
  type: string;
  status: AiJobStatus;
  resultBlogPostId: number | null;
  resultJson: string | null;
  errorMessage: string | null;
  failure: AiJobFailure | null;
  retryable: boolean;
  retryCount: number;
  retriedFromJobId: number | null;
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

export type LocalRepositoryDefault = {
  name: string;
  localPath: string;
  normalizedLocalPath: string;
  defaultBranch: string;
  description?: string | null;
  active: boolean;
  readable: boolean;
  registered: boolean;
  message?: string | null;
};

export type CreateLocalRepositoryPayload = {
  name: string;
  localPath: string;
  defaultBranch?: string | null;
  description?: string | null;
  active?: boolean | null;
};

export type UpdateLocalRepositoryPayload = CreateLocalRepositoryPayload;

export type LocalRepositoryAnalysisMode = "LOCAL_ONLY" | "OPENAI";

export type LocalRepositoryAnalysisStatus = "SUCCEEDED" | "FAILED" | "RUNNING" | "PENDING" | string;

export type AnalyzeLocalRepositoryPayload = {
  commitLimit?: number | null;
  includeUncommittedChanges?: boolean | null;
  analysisMode?: LocalRepositoryAnalysisMode | null;
  focus?: string | null;
  createBlogPost?: boolean | null;
};

export type AnalysisReport = {
  id: number;
  localRepositoryId: number;
  status: LocalRepositoryAnalysisStatus;
  analysisMode: LocalRepositoryAnalysisMode;
  commitLimit: number;
  includeUncommittedChanges: boolean;
  focus?: string | null;
  sourceSummary?: string | null;
  analysisSummary?: string | null;
  keywords: string[];
  topicCandidates: Array<{
    title: string;
    angle?: string | null;
    reason?: string | null;
    sourceFiles?: string[];
    tags?: string[];
  }>;
  recommendedTitle?: string | null;
  draftMarkdown?: string | null;
  createdBlogPostId?: number | null;
  modelName?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateBlogPostFromAnalysisPayload = {
  title?: string | null;
  summary?: string | null;
  tags?: string[] | null;
  markReviewReady?: boolean | null;
};

export type BlogWritingMode = "LOCAL_ONLY" | "OPENAI";

export type WriteBlogPostFromAnalysisPayload = {
  selectedKeywords?: string[] | null;
  selectedTopicTitle?: string | null;
  writingFocus?: string | null;
  audience?: string | null;
  writingMode?: BlogWritingMode | null;
  markReviewReady?: boolean | null;
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

export type CreatePublishTargetPayload = {
  channel: "GITHUB_PAGES" | "VELOG";
  role: "PRIMARY" | "SECONDARY";
  name: string;
  baseUrl?: string | null;
  repositoryFullName?: string | null;
  branchName?: string | null;
  contentRootPath?: string | null;
  customDomain?: string | null;
  active?: boolean | null;
};

export type UpdatePublishTargetPayload = Omit<CreatePublishTargetPayload, "channel">;

export type GitHubRepositoryOption = {
  name: string;
  fullName: string;
  ownerLogin: string;
  defaultBranch: string;
  privateRepository: boolean;
  fork: boolean;
  githubPagesCandidate: boolean;
  htmlUrl: string;
  updatedAt: string;
};

export type GitHubBranchOption = {
  name: string;
  commitSha: string;
  protectedBranch: boolean;
};

export type GitHubPagesConnectionTest = {
  targetId: number;
  repositoryFullName: string;
  branchName: string;
  contentRootPath: string;
  success: boolean;
  checkedItems: string[];
  warnings: string[];
  repositoryUrl: string;
  branchUrl: string;
  contentRootUrl: string;
  message: string;
  checkedAt: string;
};

export type PublishStrategy = {
  primaryChannel: string;
  exposureChannel: string;
  markdownPolicy: string;
  targets: PublishTarget[];
};
