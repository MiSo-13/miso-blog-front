import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Image, ImagePlus, Loader2, Upload } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { EmptyState, Notice } from "../components/StateBlock";
import { api, apiBaseUrl } from "../lib/api";
import { formatDateTime } from "../lib/format";
import type { BlogMediaAsset } from "../types/api";

const acceptedImageTypes = "image/gif,image/jpeg,image/png,image/webp";

function resolveAssetUrl(publicUrl: string) {
  if (/^https?:\/\//i.test(publicUrl)) {
    return publicUrl;
  }

  return `${apiBaseUrl.replace(/\/$/, "")}/${publicUrl.replace(/^\//, "")}`;
}

function formatFileSize(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "-";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

async function copyText(value: string) {
  if (!navigator.clipboard) {
    return;
  }

  await navigator.clipboard.writeText(value);
}

export default function MediaLibrary() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [note, setNote] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const mediaImagesQuery = useQuery({
    queryKey: ["media-images"],
    queryFn: api.mediaImages,
    retry: false,
  });
  const uploadMutation = useMutation({
    mutationFn: () => api.uploadMediaImage(file!, altText.trim() || null, note.trim() || null),
    onSuccess: () => {
      setFile(null);
      setAltText("");
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["media-images"] });
    },
  });

  const assets = useMemo(
    () => (mediaImagesQuery.isSuccess ? mediaImagesQuery.data : []),
    [mediaImagesQuery.data, mediaImagesQuery.isSuccess],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || uploadMutation.isPending) {
      return;
    }

    uploadMutation.mutate();
  };

  const handleCopy = async (key: string, value: string) => {
    await copyText(value);
    setCopiedId(key);
    window.setTimeout(() => setCopiedId((current) => (current === key ? null : current)), 1200);
  };

  return (
    <div className="pt-8">
      <section className="mb-8">
        <p className="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">이미지</p>
        <h1 className="mb-2 text-3xl font-bold text-gray-950 dark:text-white">이미지 보관함</h1>
        <p className="max-w-2xl text-gray-600 dark:text-zinc-400">
          블로그 작성에 사용할 이미지를 업로드하고, 생성 요청이나 마크다운 본문에 사용할 주소를 관리합니다.
        </p>
      </section>

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex items-center gap-3">
          <ImagePlus className="text-blue-600" size={22} />
          <h2 className="text-xl font-bold text-gray-950 dark:text-white">이미지 업로드</h2>
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">파일</span>
              <input
                accept={acceptedImageTypes}
                className="w-full rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:file:bg-zinc-900 dark:file:text-zinc-200 dark:focus:ring-blue-500/15"
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                대체 텍스트
              </span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
              />
            </label>
          </div>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">사진 메모</span>
            <textarea
              className="min-h-20 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-xs text-gray-500 dark:text-zinc-500">jpg, png, webp, gif 파일을 업로드할 수 있습니다.</p>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!file || uploadMutation.isPending}
              title="이미지 업로드"
              type="submit"
            >
              {uploadMutation.isPending ? <Loader2 className="animate-spin" size={17} /> : <Upload size={17} />}
              업로드
            </button>
          </div>
        </form>
        {uploadMutation.isError ? (
          <div className="mt-4">
            <Notice
              description="업로드를 완료하지 못했습니다. 파일 형식과 서버 상태를 확인해 주세요."
              icon={ImagePlus}
              tone="gray"
            />
          </div>
        ) : null}
      </section>

      {assets.length === 0 ? (
        <EmptyState
          description="서버가 연결되고 이미지가 업로드되면 이곳에 목록이 표시됩니다."
          icon={Image}
          title="업로드된 이미지가 없습니다"
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <MediaAssetCard asset={asset} copiedId={copiedId} key={asset.id} onCopy={handleCopy} />
          ))}
        </section>
      )}
    </div>
  );
}

function MediaAssetCard({
  asset,
  copiedId,
  onCopy,
}: {
  asset: BlogMediaAsset;
  copiedId: string | null;
  onCopy: (key: string, value: string) => void;
}) {
  const imageUrl = resolveAssetUrl(asset.publicUrl);
  const markdown = `![${asset.altText || asset.originalFilename}](${asset.publicUrl})`;

  return (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="aspect-[4/3] bg-gray-100 dark:bg-zinc-950">
        <img
          alt={asset.altText || asset.originalFilename}
          className="h-full w-full object-cover"
          loading="lazy"
          src={imageUrl}
        />
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-gray-950 dark:text-white">{asset.originalFilename}</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">
              {formatFileSize(asset.fileSize)} · {formatDateTime(asset.createdAt)}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
              title="이미지 주소 복사"
              type="button"
              onClick={() => onCopy(`url-${asset.id}`, asset.publicUrl)}
            >
              {copiedId === `url-${asset.id}` ? <Check size={17} /> : <Copy size={17} />}
            </button>
            <button
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
              title="마크다운 복사"
              type="button"
              onClick={() => onCopy(`markdown-${asset.id}`, markdown)}
            >
              {copiedId === `markdown-${asset.id}` ? <Check size={17} /> : <Image size={17} />}
            </button>
            <a
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
              href={imageUrl}
              rel="noreferrer"
              target="_blank"
              title="이미지 열기"
            >
              <ExternalLink size={17} />
            </a>
          </div>
        </div>
        {asset.altText ? <p className="mb-2 text-sm text-gray-700 dark:text-zinc-300">{asset.altText}</p> : null}
        {asset.note ? <p className="line-clamp-3 text-xs leading-5 text-gray-500 dark:text-zinc-500">{asset.note}</p> : null}
        <p className="mt-3 truncate rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-zinc-950 dark:text-zinc-400">
          {asset.publicUrl}
        </p>
      </div>
    </article>
  );
}
