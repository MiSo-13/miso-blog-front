import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Code2,
  ExternalLink,
  FileText,
  LinkIcon,
  Loader2,
  PlusCircle,
  Power,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, Notice } from "../components/StateBlock";
import { api } from "../lib/api";
import { formatDateTime } from "../lib/format";
import type {
  BlogReferenceType,
  BlogReferenceUrl,
  CreateBlogReferenceUrlPayload,
  UpdateBlogReferenceUrlPayload,
} from "../types/api";

type ReferenceFilter = "ALL" | BlogReferenceType;
type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

type ReferenceForm = {
  type: BlogReferenceType;
  title: string;
  url: string;
  description: string;
  tagsText: string;
  active: boolean;
};

const emptyForm: ReferenceForm = {
  type: "GENERAL",
  title: "",
  url: "",
  description: "",
  tagsText: "",
  active: true,
};

const referenceTypeLabels: Record<BlogReferenceType, string> = {
  DEVELOPMENT: "개발 레퍼런스",
  GENERAL: "일반 레퍼런스",
};

const referenceTypeDescriptions: Record<BlogReferenceType, string> = {
  DEVELOPMENT: "개발 블로그 초안 생성에 참고됩니다.",
  GENERAL: "일반 블로그 초안 생성에 참고됩니다.",
};

function parseTags(value: string) {
  return value
    .split(/[,\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toForm(reference: BlogReferenceUrl): ReferenceForm {
  return {
    type: reference.type,
    title: reference.title,
    url: reference.url,
    description: reference.description ?? "",
    tagsText: reference.tags.join(", "),
    active: reference.active,
  };
}

function toPayload(form: ReferenceForm): CreateBlogReferenceUrlPayload {
  return {
    type: form.type,
    title: form.title.trim(),
    url: form.url.trim(),
    description: form.description.trim() || null,
    tags: parseTags(form.tagsText),
    active: form.active,
  };
}

function hasRequiredFields(form: ReferenceForm) {
  return form.title.trim().length > 0 && form.url.trim().length > 0;
}

export default function BlogReferences() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<ReferenceFilter>("ALL");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL");
  const [searchText, setSearchText] = useState("");
  const [form, setForm] = useState<ReferenceForm>(emptyForm);

  const referencesQuery = useQuery({
    queryKey: ["blog-reference-urls", typeFilter],
    queryFn: () => api.blogReferenceUrls(typeFilter === "ALL" ? null : typeFilter),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateBlogReferenceUrlPayload) => api.createBlogReferenceUrl(payload),
    onSuccess: () => {
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["blog-reference-urls"] });
    },
  });

  const references = referencesQuery.isSuccess ? referencesQuery.data : [];
  const filteredReferences = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return references.filter((reference) => {
      const matchesActive =
        activeFilter === "ALL" ||
        (activeFilter === "ACTIVE" && reference.active) ||
        (activeFilter === "INACTIVE" && !reference.active);
      const haystack = [
        reference.title,
        reference.url,
        reference.description ?? "",
        reference.tags.join(" "),
        referenceTypeLabels[reference.type],
      ]
        .join(" ")
        .toLowerCase();

      return matchesActive && (!keyword || haystack.includes(keyword));
    });
  }, [activeFilter, references, searchText]);

  const activeCount = references.filter((reference) => reference.active).length;

  const updateField = (field: keyof ReferenceForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasRequiredFields(form) || createMutation.isPending) {
      return;
    }

    createMutation.mutate(toPayload(form));
  };

  return (
    <div className="pt-8">
      <section className="mb-8">
        <p className="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">레퍼런스</p>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-950 dark:text-white">레퍼런스 URL 관리</h1>
            <p className="max-w-3xl text-sm leading-6 text-gray-600 dark:text-zinc-400">
              자주 참고하는 문서, 지도, 공식 안내, 기존 자료 링크를 저장합니다. 활성화된 레퍼런스는 AI 초안 생성,
              AI 수정, 품질 개선 작업에서 함께 참고됩니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p>
              <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">전체</span>
              <span className="text-lg font-bold text-gray-950 dark:text-white">{references.length}</span>
            </p>
            <p>
              <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">활성</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-300">{activeCount}</span>
            </p>
          </div>
        </div>
      </section>

      <Notice
        description="서버는 레퍼런스 URL의 본문을 직접 읽지 않습니다. 설명에 어떤 점을 참고해야 하는지 적어두면 AI가 더 정확하게 활용합니다."
        icon={BookOpen}
        tone="blue"
        title="설명 메모가 핵심입니다"
      />

      <section className="my-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex items-center gap-3">
          <PlusCircle className="text-blue-600" size={22} />
          <div>
            <h2 className="text-xl font-bold text-gray-950 dark:text-white">레퍼런스 추가</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
              이번 글뿐 아니라 앞으로의 AI 작성 작업에도 계속 참고할 링크를 저장합니다.
            </p>
          </div>
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">유형</span>
              <select
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                value={form.type}
                onChange={(event) => updateField("type", event.target.value as BlogReferenceType)}
              >
                <option value="GENERAL">일반 레퍼런스</option>
                <option value="DEVELOPMENT">개발 레퍼런스</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">제목</span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                maxLength={200}
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
              />
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">URL</span>
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              maxLength={1000}
              type="url"
              value={form.url}
              onChange={(event) => updateField("url", event.target.value)}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">설명</span>
            <textarea
              className="min-h-24 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              maxLength={1000}
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">태그</span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                value={form.tagsText}
                onChange={(event) => updateField("tagsText", event.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 pb-2 text-sm text-gray-600 dark:text-zinc-400">
              <input checked={form.active} type="checkbox" onChange={(event) => updateField("active", event.target.checked)} />
              활성화
            </label>
          </div>

          <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-zinc-800">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!hasRequiredFields(form) || createMutation.isPending}
              title="레퍼런스 URL 추가"
              type="submit"
            >
              {createMutation.isPending ? <Loader2 className="animate-spin" size={17} /> : <PlusCircle size={17} />}
              추가
            </button>
          </div>
        </form>
      </section>

      <section className="mb-5 grid gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:grid-cols-[1fr_auto_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
          <input
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </label>
        <select
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as ReferenceFilter)}
        >
          <option value="ALL">전체 유형</option>
          <option value="GENERAL">일반</option>
          <option value="DEVELOPMENT">개발</option>
        </select>
        <select
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
          value={activeFilter}
          onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}
        >
          <option value="ALL">전체 상태</option>
          <option value="ACTIVE">활성</option>
          <option value="INACTIVE">비활성</option>
        </select>
      </section>

      {filteredReferences.length === 0 ? (
        <EmptyState
          description="서버가 연결되고 레퍼런스가 저장되면 이곳에 목록이 표시됩니다."
          icon={LinkIcon}
          title="표시할 레퍼런스가 없습니다"
        />
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {filteredReferences.map((reference) => (
            <ReferenceCard key={reference.id} reference={reference} />
          ))}
        </section>
      )}
    </div>
  );
}

function ReferenceCard({ reference }: { reference: BlogReferenceUrl }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ReferenceForm>(() => toForm(reference));
  const Icon = reference.type === "DEVELOPMENT" ? Code2 : FileText;

  useEffect(() => {
    setForm(toForm(reference));
  }, [reference]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateBlogReferenceUrlPayload) => api.updateBlogReferenceUrl(reference.id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-reference-urls"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteBlogReferenceUrl(reference.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-reference-urls"] }),
  });

  const updateField = (field: keyof ReferenceForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasRequiredFields(form) || updateMutation.isPending) {
      return;
    }

    updateMutation.mutate(toPayload(form));
  };

  const handleToggleActive = () => {
    const nextActive = !form.active;
    setForm((current) => ({ ...current, active: nextActive }));
    updateMutation.mutate({ active: nextActive });
  };

  const handleDelete = () => {
    if (deleteMutation.isPending) {
      return;
    }

    const confirmed = window.confirm("이 레퍼런스 URL을 삭제할까요? 삭제하면 이후 AI 작업에서 참고하지 않습니다.");
    if (confirmed) {
      deleteMutation.mutate();
    }
  };

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-gray-950 dark:text-white">{reference.title}</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">{referenceTypeDescriptions[reference.type]}</p>
          </div>
        </div>
        <span
          className={
            reference.active
              ? "shrink-0 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-300"
              : "shrink-0 text-xs font-bold uppercase tracking-wider text-gray-400"
          }
        >
          {reference.active ? "활성" : "비활성"}
        </span>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">유형</span>
            <select
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={form.type}
              onChange={(event) => updateField("type", event.target.value as BlogReferenceType)}
            >
              <option value="GENERAL">일반</option>
              <option value="DEVELOPMENT">개발</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">제목</span>
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              maxLength={200}
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
            />
          </label>
        </div>

        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">URL</span>
          <input
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
            maxLength={1000}
            type="url"
            value={form.url}
            onChange={(event) => updateField("url", event.target.value)}
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">설명</span>
          <textarea
            className="min-h-24 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
            maxLength={1000}
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">태그</span>
          <input
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
            value={form.tagsText}
            onChange={(event) => updateField("tagsText", event.target.value)}
          />
        </label>

        <div className="flex flex-col justify-between gap-3 border-t border-gray-100 pt-4 dark:border-zinc-800 sm:flex-row sm:items-center">
          <p className="text-xs text-gray-500 dark:text-zinc-500">
            수정일 {formatDateTime(reference.updatedAt)}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <a
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-blue-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              href={reference.url}
              rel="noreferrer"
              target="_blank"
              title="URL 열기"
            >
              <ExternalLink size={17} />
            </a>
            <button
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              disabled={updateMutation.isPending}
              title={form.active ? "비활성화" : "활성화"}
              type="button"
              onClick={handleToggleActive}
            >
              <Power size={17} />
            </button>
            <button
              className="inline-flex items-center justify-center rounded-lg border border-red-100 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10"
              disabled={deleteMutation.isPending}
              title="삭제"
              type="button"
              onClick={handleDelete}
            >
              {deleteMutation.isPending ? <Loader2 className="animate-spin" size={17} /> : <Trash2 size={17} />}
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!hasRequiredFields(form) || updateMutation.isPending}
              title="저장"
              type="submit"
            >
              {updateMutation.isPending ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
              저장
            </button>
          </div>
        </div>
      </form>
    </article>
  );
}
