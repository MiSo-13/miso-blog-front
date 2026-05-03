import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  FileText,
  FolderOpen,
  Github,
  Images,
  PenLine,
  PlusCircle,
  Send,
  Settings,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState, Notice } from "../components/StateBlock";
import { api } from "../lib/api";
import { formatDateTime, statusLabel } from "../lib/format";
import type { BlogPostStatus } from "../types/api";

const statusTone: Record<BlogPostStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300",
  REVIEW_READY: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  APPROVED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  PUBLISHED: "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950",
  FAILED: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

export default function Dashboard() {
  const blogPostsQuery = useQuery({
    queryKey: ["blog-posts"],
    queryFn: api.blogPosts,
    retry: false,
  });
  const jobsQuery = useQuery({
    queryKey: ["ai-jobs"],
    queryFn: api.jobs,
    retry: false,
  });
  const localRepositoriesQuery = useQuery({
    queryKey: ["local-repositories"],
    queryFn: api.localRepositories,
    retry: false,
  });
  const gitRepositoriesQuery = useQuery({
    queryKey: ["git-repositories"],
    queryFn: api.gitRepositories,
    retry: false,
  });
  const mediaImagesQuery = useQuery({
    queryKey: ["media-images"],
    queryFn: api.mediaImages,
    retry: false,
  });

  const posts = blogPostsQuery.isSuccess ? blogPostsQuery.data : [];
  const jobs = jobsQuery.isSuccess ? jobsQuery.data : [];
  const localRepositories = localRepositoriesQuery.isSuccess ? localRepositoriesQuery.data : [];
  const gitRepositories = gitRepositoriesQuery.isSuccess ? gitRepositoriesQuery.data : [];
  const mediaImages = mediaImagesQuery.isSuccess ? mediaImagesQuery.data : [];
  const statusCounts = posts.reduce(
    (acc, post) => {
      acc[post.status] += 1;
      return acc;
    },
    {
      DRAFT: 0,
      REVIEW_READY: 0,
      APPROVED: 0,
      PUBLISHED: 0,
      FAILED: 0,
    } satisfies Record<BlogPostStatus, number>,
  );
  const latestPosts = [...posts].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)).slice(0, 6);
  const activeRepositoryCount =
    localRepositories.filter((repository) => repository.active).length +
    gitRepositories.filter((repository) => repository.active).length;
  const runningJobCount = jobs.filter((job) => job.status === "PENDING" || job.status === "RUNNING").length;
  const failedJobCount = jobs.filter((job) => job.status === "FAILED").length;
  const needsReviewCount = statusCounts.REVIEW_READY + statusCounts.APPROVED;
  const hasAnyData =
    blogPostsQuery.isSuccess ||
    jobsQuery.isSuccess ||
    localRepositoriesQuery.isSuccess ||
    gitRepositoriesQuery.isSuccess ||
    mediaImagesQuery.isSuccess;

  return (
    <div className="pt-8">
      <section className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">MiSo Blog 작업 공간</p>
          <h1 className="mb-2 text-3xl font-bold leading-tight text-gray-950 dark:text-white">대시보드</h1>
          <p className="max-w-2xl text-base leading-relaxed text-gray-600 dark:text-zinc-400">
            초안 작성부터 검토, 승인, 발행, 내보내기까지 한곳에서 관리합니다.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 p-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900 sm:px-4"
            title="설정"
            to="/settings"
          >
            <Settings size={18} />
            <span className="hidden sm:inline">설정</span>
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 p-2.5 text-sm font-semibold text-white shadow-soft transition active:scale-[0.98] sm:px-4"
            title="새 글 작성"
            to="/new"
          >
            <PlusCircle size={18} />
            <span className="hidden sm:inline">새 글</span>
          </Link>
        </div>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "작성 중",
            value: blogPostsQuery.isSuccess ? statusCounts.DRAFT : "-",
            icon: FileText,
            caption: "초안 상태의 글",
          },
          {
            label: "검토 필요",
            value: blogPostsQuery.isSuccess ? needsReviewCount : "-",
            icon: CheckCircle2,
            caption: "검토 대기와 승인된 글",
          },
          {
            label: "발행됨",
            value: blogPostsQuery.isSuccess ? statusCounts.PUBLISHED : "-",
            icon: Send,
            caption: "발행 완료 글",
          },
          {
            label: "AI 진행 중",
            value: jobsQuery.isSuccess ? runningJobCount : "-",
            icon: Activity,
            caption: failedJobCount > 0 ? `확인 필요 ${failedJobCount}` : "대기 또는 실행 중 작업",
          },
        ].map(({ label, value, icon: Icon, caption }) => (
          <article className="rounded-lg border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900" key={label}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-950 dark:text-white">{value}</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-200">{label}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">{caption}</p>
          </article>
        ))}
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-3">
        <StatusLink
          caption="등록된 활성 저장소"
          href="/projects"
          icon={FolderOpen}
          label="로컬 분석"
          value={localRepositoriesQuery.isSuccess ? localRepositories.filter((repository) => repository.active).length : "-"}
        />
        <StatusLink
          caption="등록된 활성 저장소"
          href="/github-projects"
          icon={Github}
          label="GitHub 분석"
          value={gitRepositoriesQuery.isSuccess ? gitRepositories.filter((repository) => repository.active).length : "-"}
        />
        <StatusLink
          caption="업로드된 이미지"
          href="/media"
          icon={Images}
          label="이미지 보관함"
          value={mediaImagesQuery.isSuccess ? mediaImages.length : "-"}
        />
      </section>

      {!hasAnyData ? (
        <div className="mb-8">
          <Notice
            description="서버가 연결되면 글, 저장소, 이미지, AI 작업 현황이 이곳에 표시됩니다."
            icon={Sparkles}
            title="작업 공간을 준비하는 중입니다"
            tone="gray"
          />
        </div>
      ) : null}

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-950 dark:text-white">최근 글</h2>
          <Link className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400" to="/drafts">
            전체 보기
          </Link>
        </div>

        {latestPosts.length === 0 ? (
          <EmptyState
            action={
              <Link className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white" title="글쓰기 시작" to="/new">
                <PlusCircle size={17} />
                글쓰기
              </Link>
            }
            description="글을 작성하거나 분석 결과로 초안을 만들면 최근 글이 이곳에 표시됩니다."
            icon={FileText}
            title="표시할 글이 없습니다"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {latestPosts.map((post) => (
              <article
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-soft dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/40"
                key={post.id}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${statusTone[post.status]}`}>
                    {statusLabel(post.status)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-zinc-500">{formatDateTime(post.updatedAt)}</span>
                </div>
                <h3 className="mb-2 text-xl font-bold leading-snug text-gray-950 dark:text-white">{post.title}</h3>
                <p className="mb-5 min-h-11 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">
                  {post.summary || "요약이 아직 없습니다."}
                </p>
                <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-zinc-800">
                  <span className="text-xs text-gray-500 dark:text-zinc-500">v{post.currentVersionNo}</span>
                  <Link
                    className="inline-flex items-center gap-2 rounded-lg p-2 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10"
                    title="글 편집"
                    to={`/drafts/${post.id}`}
                  >
                    <PenLine size={16} />
                    <span className="hidden sm:inline">편집</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {activeRepositoryCount > 0 || jobs.length > 0 ? (
        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-2 text-lg font-bold text-gray-950 dark:text-white">분석 입력</h2>
            <p className="text-sm leading-6 text-gray-600 dark:text-zinc-400">
              활성 저장소 {activeRepositoryCount}개와 이미지 {mediaImages.length}개를 글 작성에 사용할 수 있습니다.
            </p>
          </article>
          <article className="rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-2 text-lg font-bold text-gray-950 dark:text-white">AI 작업</h2>
            <p className="text-sm leading-6 text-gray-600 dark:text-zinc-400">
              총 {jobs.length}개 작업 중 {runningJobCount}개가 진행 중입니다.
            </p>
            <Link
              className="mt-4 inline-flex items-center gap-2 rounded-lg p-2 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10"
              title="AI 작업 보기"
              to="/jobs"
            >
              <Activity size={16} />
              <span>작업 보기</span>
            </Link>
          </article>
        </section>
      ) : null}
    </div>
  );
}

function StatusLink({
  caption,
  href,
  icon: Icon,
  label,
  value,
}: {
  caption: string;
  href: string;
  icon: LucideIcon;
  label: string;
  value: number | string;
}) {
  return (
    <Link
      className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-soft dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/40"
      title={`${label} 열기`}
      to={href}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-200">
          <Icon size={20} />
        </div>
        <div>
          <p className="font-bold text-gray-950 dark:text-white">{label}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-500">{caption}</p>
        </div>
      </div>
      <span className="text-2xl font-bold text-gray-950 dark:text-white">{value}</span>
    </Link>
  );
}
