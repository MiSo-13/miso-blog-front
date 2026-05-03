import {
  ArrowRight,
  CheckCircle2,
  Code2,
  FileText,
  Github,
  Images,
  ListChecks,
  PenLine,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

const quickSteps = [
  {
    title: "글 유형을 고릅니다",
    description: "개발 블로그는 Git 기록에서 글감을 뽑고, 일반 블로그는 메모와 사진으로 후기를 만듭니다.",
    href: "/new",
    icon: PenLine,
  },
  {
    title: "초안을 만듭니다",
    description: "분석 결과나 입력한 메모를 바탕으로 AI 작업을 시작합니다. 긴 작업은 AI 작업 화면에서 상태를 확인할 수 있습니다.",
    href: "/jobs",
    icon: Wand2,
  },
  {
    title: "직접 다듬습니다",
    description: "제목, 요약, 태그, Markdown 본문을 확인하고 내 경험과 판단을 꼭 보강합니다.",
    href: "/drafts",
    icon: FileText,
  },
  {
    title: "검토 후 발행합니다",
    description: "품질 리뷰와 수정 전후 비교를 확인한 뒤 GitHub Pages 발행 또는 Velog export로 이어갑니다.",
    href: "/settings",
    icon: Rocket,
  },
];

const statusItems = [
  ["초안", "작성 중인 글입니다. 직접 편집하고 AI 수정 요청을 할 수 있습니다."],
  ["검토 대기", "사용자가 읽고 승인할 준비가 된 글입니다. 마지막 사실 확인을 합니다."],
  ["승인됨", "발행해도 되는 글입니다. GitHub Pages와 Velog 내보내기를 사용할 수 있습니다."],
  ["발행됨", "발행 완료 상태입니다. 발행 정보와 버전 변경 내역을 중심으로 확인합니다."],
];

const devTips = [
  "처음에는 로컬 Git 분석의 LOCAL_ONLY 방식을 권장합니다. 기본 분석은 외부 AI로 코드를 보내지 않습니다.",
  "focus에는 구현 기능, 장애 원인, 트러블슈팅, 구조 개선처럼 글의 방향을 구체적으로 적습니다.",
  "GitHub 저장소 분석은 timeout을 피하기 위해 비동기 AI 작업으로 시작되며, 필요하면 전체 커밋 분석 옵션을 사용할 수 있습니다.",
  "글감 후보를 고를 때는 관련 파일과 키워드를 함께 확인해 실제로 내가 구현한 내용인지 점검합니다.",
  "초안이 만들어진 뒤에는 실제 에러 메시지, 왜 그 선택을 했는지, 최종 결과를 직접 한두 문단 추가하면 글이 훨씬 자연스러워집니다.",
];

const generalTips = [
  "메모에는 방문 시간, 웨이팅, 분위기, 가격대, 재방문 의사처럼 본인만 아는 정보를 넣습니다.",
  "사진은 먼저 이미지 보관함에 업로드하고, 사진별 설명과 본문 배치 메모를 적어두면 초안 품질이 좋아집니다. 업로드 후 제외한 사진은 글 작성 자료에 포함되지 않습니다.",
  "네이버 블로그 양식을 고르면 짧은 문단, 사진 중심 흐름, 친근한 후기체가 작성 지시에 함께 들어갑니다.",
  "필수 문구는 광고 고지, 꼭 들어가야 하는 표현, 개인적으로 강조하고 싶은 문장을 넣는 곳입니다.",
  "키워드는 너무 많이 넣기보다 검색 의도를 담은 4~8개 정도가 좋습니다.",
];

const editChecklist = [
  "제목이 무엇을 해결했는지 또는 어떤 경험인지 분명히 말하는지 확인합니다.",
  "요약이 검색 결과에서 읽혀도 자연스럽고 과장되지 않았는지 봅니다.",
  "본문에 실제 경험, 판단, 확인 과정이 들어갔는지 보강합니다.",
  "AI가 단정한 사실 중 내가 확인하지 않은 내용은 삭제하거나 표현을 낮춥니다.",
  "수정 후 버전 diff에서 제목, 요약, 본문, 태그 변경을 다시 확인합니다.",
];

const publishChecklist = [
  "APPROVED 상태인지 확인합니다.",
  "GitHub Pages 대상 저장소, 브랜치, content root path 연결 테스트를 먼저 실행합니다.",
  "발행은 실제 저장소에 commit을 만들 수 있으므로 제목과 파일 경로를 마지막으로 확인합니다.",
  "Velog는 자동 발행이 아니라 복사/붙여넣기용 export입니다. title, markdown, tags를 각각 확인합니다.",
  "발행 후 일반 수정은 제한될 수 있으므로 이미지 위치와 태그를 마지막으로 점검합니다.",
];

export default function UserGuide() {
  return (
    <div className="pt-8">
      <section className="mb-10">
        <p className="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">사용자 가이드</p>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="mb-3 max-w-3xl text-3xl font-bold leading-tight text-gray-950 dark:text-white">
              처음 써도 블로그 초안을 만들고, 직접 다듬고, 안전하게 발행할 수 있습니다
            </h1>
            <p className="max-w-3xl text-base leading-7 text-gray-600 dark:text-zinc-400">
              MiSo Blog는 개발 기록과 일반 후기를 모두 블로그 초안으로 바꿔주는 작업 공간입니다. AI는 초안을 돕는 도구이고,
              최종 품질은 사용자가 경험과 판단을 보강할 때 가장 좋아집니다.
            </p>
          </div>
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98]"
            title="글쓰기 시작"
            to="/new"
          >
            <Sparkles size={18} />
            시작하기
          </Link>
        </div>
      </section>

      <section className="mb-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickSteps.map((step, index) => (
          <GuideCard description={step.description} href={step.href} icon={step.icon} key={step.title} title={`${index + 1}. ${step.title}`} />
        ))}
      </section>

      <section className="mb-10 rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 flex items-center gap-3">
          <CheckCircle2 className="text-blue-600" size={22} />
          <div>
            <h2 className="text-xl font-bold text-gray-950 dark:text-white">글 상태를 이해하기</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">모든 글은 같은 상태 흐름으로 관리됩니다.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {statusItems.map(([label, description]) => (
            <article className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-950" key={label}>
              <h3 className="mb-2 font-bold text-gray-950 dark:text-white">{label}</h3>
              <p className="text-sm leading-6 text-gray-600 dark:text-zinc-400">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mb-10 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <SectionHeader
            description="내가 실제로 구현한 코드, 장애 대응, 구조 개선, 배포 경험에서 글감을 뽑습니다."
            icon={Code2}
            title="개발 블로그 작성"
          />
          <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50/80 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-300" size={20} />
              <p className="text-sm leading-6 text-blue-900 dark:text-blue-100">
                기본 추천은 로컬 Git 분석입니다. LOCAL_ONLY 분석은 외부 AI로 코드를 보내지 않고 Git 기록을 서버 안에서만 읽습니다.
              </p>
            </div>
          </div>
          <StepList
            items={[
              ["저장소 후보 확인", "관리자가 등록한 후보가 있으면 프로젝트 화면에서 바로 등록합니다."],
              ["저장소 등록", "프로젝트 이름, 로컬 경로, 기본 브랜치, 설명을 입력합니다."],
              ["분석 실행", "commit 개수, uncommitted 포함 여부, 분석 모드, focus를 설정합니다."],
              ["글감 선택", "키워드와 글감 후보를 고르고, 독자와 작성 초점을 적어 초안을 만듭니다."],
              ["직접 보강", "왜 이 결정을 했는지, 어떤 문제가 있었는지, 결과가 어땠는지 추가합니다."],
            ]}
          />
          <TipList items={devTips} />
          <div className="mt-6 flex flex-wrap gap-2">
            <GuideLink href="/projects" icon={Code2} label="로컬 분석" />
            <GuideLink href="/github-projects" icon={Github} label="GitHub 분석" />
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <SectionHeader
            description="맛집, 카페, 여행, 제품 리뷰, 일상 글을 메모와 사진 기반으로 작성합니다."
            icon={FileText}
            title="일반 블로그 작성"
          />
          <StepList
            items={[
              ["사진 업로드", "이미지 보관함에 사진을 올리고 대체 텍스트와 사진 메모를 적습니다."],
              ["작성 양식 선택", "기본 블로그 또는 네이버 블로그 양식을 고릅니다."],
              ["글 정보 입력", "카테고리, 장소명, 주소 힌트, 꼭 넣을 문구, 메모, 키워드, 말투, 독자를 입력합니다."],
              ["AI 초안 생성", "긴 작업은 비동기 AI 작업으로 진행되며 완료 후 초안으로 이동합니다."],
              ["실제 경험 보강", "방문 시간, 가격대, 웨이팅, 재방문 의사처럼 직접 경험한 정보를 추가합니다."],
              ["품질 점검", "품질 리뷰와 자동 개선을 사용해 자연스러움과 근거를 확인합니다."],
            ]}
          />
          <TipList items={generalTips} />
          <div className="mt-6 flex flex-wrap gap-2">
            <GuideLink href="/media" icon={Images} label="이미지" />
            <GuideLink href="/general/new" icon={PenLine} label="일반 글쓰기" />
          </div>
        </section>
      </div>

      <section className="mb-10 rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <SectionHeader
          description="AI가 만든 초안은 바로 발행하지 말고, 직접 읽고 다듬은 뒤 검토 상태로 넘기는 흐름을 권장합니다."
          icon={ListChecks}
          title="편집과 품질 점검"
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Checklist title="편집 체크리스트" items={editChecklist} />
          <div>
            <h3 className="mb-3 font-bold text-gray-950 dark:text-white">AI 추가 수정 요청을 잘 쓰는 법</h3>
            <div className="space-y-3 text-sm leading-6 text-gray-600 dark:text-zinc-400">
              <p>“더 자연스럽게”보다 “도입부에 방문 시간과 웨이팅을 넣고, 과장 표현을 줄여줘”처럼 구체적으로 적는 것이 좋습니다.</p>
              <p>제목과 태그를 유지하고 싶다면 편집 화면에서 보존 옵션을 켜고, 바꾸고 싶은 톤이나 길이를 함께 적어주세요.</p>
              <p>자동 품질 개선은 여러 번 AI 호출이 이어질 수 있으므로, AI 작업 화면에서 상태와 실패 사유를 확인합니다.</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <GuideLink href="/drafts" icon={FileText} label="초안 보기" />
              <GuideLink href="/jobs" icon={Wand2} label="AI 작업" />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10 rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <SectionHeader
          description="MiSo Blog는 GitHub Pages를 원본 채널로, Velog를 노출 채널로 사용하는 흐름을 지원합니다."
          icon={Rocket}
          title="발행 전 마지막 확인"
        />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Checklist title="발행 체크리스트" items={publishChecklist} />
          <div className="rounded-lg bg-gray-50 p-5 dark:bg-zinc-950">
            <h3 className="mb-3 font-bold text-gray-950 dark:text-white">발행 대상 준비</h3>
            <p className="mb-4 text-sm leading-6 text-gray-600 dark:text-zinc-400">
              설정 화면에서 기본 발행 대상을 만들고, GitHub 저장소와 브랜치를 선택한 뒤 연결 테스트를 먼저 실행하세요.
            </p>
            <GuideLink href="/settings" icon={Settings} label="설정 열기" />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-amber-100 bg-amber-50 p-6 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 shrink-0" size={22} />
          <div>
            <h2 className="mb-2 text-lg font-bold">운영 주의사항</h2>
            <ul className="space-y-2 text-sm leading-6">
              <li>실제 OpenAI 호출은 비용이 발생합니다. 긴 작업은 AI 작업 화면에서 상태와 재시도 가능 여부를 확인하세요.</li>
              <li>개발 블로그의 OPENAI 모드는 코드 요약이 외부 AI로 전송될 수 있으므로 명시적으로 선택한 경우에만 사용하세요.</li>
              <li>GitHub Pages 발행은 실제 저장소에 commit을 생성할 수 있습니다. 연결 테스트와 최종 본문 확인을 먼저 진행하세요.</li>
              <li>Velog는 현재 자동 발행이 아니라 export 방식입니다. 내보낸 제목, 태그, Markdown을 Velog 글쓰기 화면에 복사해 사용합니다.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function GuideCard({
  description,
  href,
  icon: Icon,
  title,
}: {
  description: string;
  href: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <Link
      className="group rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-soft dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/40"
      title={title}
      to={href}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
        <Icon size={20} />
      </div>
      <h2 className="mb-2 font-bold text-gray-950 dark:text-white">{title}</h2>
      <p className="text-sm leading-6 text-gray-600 dark:text-zinc-400">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-300">
        열기 <ArrowRight className="transition group-hover:translate-x-0.5" size={15} />
      </span>
    </Link>
  );
}

function SectionHeader({ description, icon: Icon, title }: { description: string; icon: LucideIcon; title: string }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
        <Icon size={20} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-950 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  );
}

function StepList({ items }: { items: Array<[string, string]> }) {
  return (
    <ol className="mb-6 space-y-3">
      {items.map(([title, description], index) => (
        <li className="flex gap-3" key={title}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700 dark:bg-zinc-800 dark:text-zinc-200">
            {index + 1}
          </span>
          <div>
            <p className="font-semibold text-gray-950 dark:text-white">{title}</p>
            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-zinc-400">{description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function TipList({ items }: { items: string[] }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 dark:bg-zinc-950">
      <h3 className="mb-3 text-sm font-bold text-gray-950 dark:text-white">작성 팁</h3>
      <ul className="space-y-2 text-sm leading-6 text-gray-600 dark:text-zinc-400">
        {items.map((item) => (
          <li className="flex gap-2" key={item}>
            <CheckCircle2 className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-300" size={16} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Checklist({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <h3 className="mb-3 font-bold text-gray-950 dark:text-white">{title}</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li className="flex gap-3 text-sm leading-6 text-gray-600 dark:text-zinc-400" key={item}>
            <CheckCircle2 className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-300" size={17} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GuideLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-blue-200 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-blue-500/40 dark:hover:text-blue-300"
      title={label}
      to={href}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}
