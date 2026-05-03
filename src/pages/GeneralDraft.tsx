import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlignLeft, ImagePlus, Loader2, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AiJobStatusPanel from "../components/AiJobStatusPanel";
import { api, apiBaseUrl } from "../lib/api";
import type {
  BlogMediaAsset,
  CreateGeneralBlogPostPayload,
  GeneralBlogCategory,
  GeneralBlogLength,
  GeneralBlogPhotoPayload,
} from "../types/api";

const categoryOptions: Array<{ value: GeneralBlogCategory; label: string }> = [
  { value: "RESTAURANT", label: "맛집" },
  { value: "CAFE", label: "카페" },
  { value: "TRAVEL", label: "여행" },
  { value: "PRODUCT_REVIEW", label: "제품 리뷰" },
  { value: "DAILY", label: "일상" },
  { value: "ETC", label: "기타" },
];

const lengthOptions: Array<{ value: GeneralBlogLength; label: string }> = [
  { value: "SHORT", label: "짧게" },
  { value: "MEDIUM", label: "보통" },
  { value: "LONG", label: "길게" },
];

const emptyPhoto: GeneralBlogPhotoPayload = {
  url: "",
  description: "",
  placementNote: "",
};

function parseList(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveAssetUrl(publicUrl: string) {
  if (/^https?:\/\//i.test(publicUrl)) {
    return publicUrl;
  }

  return `${apiBaseUrl.replace(/\/$/, "")}/${publicUrl.replace(/^\//, "")}`;
}

export default function GeneralDraft() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<GeneralBlogCategory>("DAILY");
  const [titleHint, setTitleHint] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [addressHint, setAddressHint] = useState("");
  const [requiredPhrasesText, setRequiredPhrasesText] = useState("");
  const [memo, setMemo] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [photos, setPhotos] = useState<GeneralBlogPhotoPayload[]>([{ ...emptyPhoto }]);
  const [photoFiles, setPhotoFiles] = useState<Record<number, File | null>>({});
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchMetas, setBatchMetas] = useState<Array<{ altText: string; note: string }>>([]);
  const [photoGroupId, setPhotoGroupId] = useState("");
  const [groupAssets, setGroupAssets] = useState<BlogMediaAsset[]>([]);
  const [imagePlacementNotes, setImagePlacementNotes] = useState("");
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("");
  const [targetLength, setTargetLength] = useState<GeneralBlogLength>("MEDIUM");
  const [markReviewReady, setMarkReviewReady] = useState(true);
  const [jobId, setJobId] = useState<number | null>(null);

  const createJobMutation = useMutation({
    mutationFn: (payload: CreateGeneralBlogPostPayload) => api.createGeneralDraftJob(payload),
    onSuccess: (job) => setJobId(job.id),
  });
  const mediaImagesQuery = useQuery({
    queryKey: ["media-images"],
    queryFn: api.mediaImages,
    retry: false,
  });
  const uploadImageMutation = useMutation({
    mutationFn: ({ index, file }: { index: number; file: File }) =>
      api.uploadMediaImage(file, photos[index]?.description || null, photos[index]?.placementNote || null),
    onSuccess: (asset, variables) => {
      updatePhoto(variables.index, "url", asset.publicUrl);
      if (asset.altText && !photos[variables.index]?.description) {
        updatePhoto(variables.index, "description", asset.altText);
      }
      if (asset.note && !photos[variables.index]?.placementNote) {
        updatePhoto(variables.index, "placementNote", asset.note);
      }
      setPhotoFiles((current) => ({ ...current, [variables.index]: null }));
      queryClient.invalidateQueries({ queryKey: ["media-images"] });
    },
  });
  const uploadImagesMutation = useMutation({
    mutationFn: () =>
      api.uploadMediaImages(
        batchFiles,
        batchMetas.map((meta) => meta.altText.trim() || null),
        batchMetas.map((meta) => meta.note.trim() || null),
      ),
    onSuccess: (result) => {
      setPhotoGroupId(result.uploadGroupId);
      setGroupAssets(result.assets);
      setBatchFiles([]);
      setBatchMetas([]);
      queryClient.invalidateQueries({ queryKey: ["media-images"] });
    },
  });

  const jobQuery = useQuery({
    queryKey: ["ai-job", jobId],
    queryFn: () => api.job(jobId!),
    enabled: jobId !== null,
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PENDING" || status === "RUNNING" ? 2000 : false;
    },
  });

  const retryJobMutation = useMutation({
    mutationFn: (nextJobId: number) => api.retryJob(nextJobId),
    onSuccess: (job) => setJobId(job.id),
  });

  useEffect(() => {
    const job = jobQuery.data;
    if (job?.status === "SUCCEEDED" && job.resultBlogPostId) {
      navigate(`/drafts/${job.resultBlogPostId}`, { replace: true });
    }
  }, [jobQuery.data, navigate]);

  const updatePhoto = (index: number, field: keyof GeneralBlogPhotoPayload, value: string) => {
    setPhotos((current) =>
      current.map((photo, photoIndex) => (photoIndex === index ? { ...photo, [field]: value } : photo)),
    );
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));
    setPhotoFiles((current) => {
      const next = { ...current };
      delete next[index];
      return next;
    });
  };

  const handleUploadPhoto = (index: number) => {
    const file = photoFiles[index];
    if (!file) {
      return;
    }
    uploadImageMutation.mutate({ index, file });
  };

  const handleBatchFiles = (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    setBatchFiles(selectedFiles);
    setBatchMetas(selectedFiles.map(() => ({ altText: "", note: "" })));
  };

  const updateBatchMeta = (index: number, field: "altText" | "note", value: string) => {
    setBatchMetas((current) =>
      current.map((meta, metaIndex) => (metaIndex === index ? { ...meta, [field]: value } : meta)),
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const groupedUrls = new Set(groupAssets.map((asset) => asset.publicUrl));
    const filteredPhotos = photos
      .map((photo) => ({
        url: photo.url?.trim() || null,
        description: photo.description?.trim() || null,
        placementNote: photo.placementNote?.trim() || null,
      }))
      .filter((photo) => photo.url || photo.description || photo.placementNote)
      .filter((photo) => !photo.url || !groupedUrls.has(photo.url));

    createJobMutation.mutate({
      category,
      titleHint: titleHint.trim() || null,
      placeName: placeName.trim() || null,
      addressHint: addressHint.trim() || null,
      requiredPhrases: parseList(requiredPhrasesText),
      memo: memo.trim() || null,
      keywords: parseList(keywordsText),
      photos: filteredPhotos,
      photoGroupId: photoGroupId || null,
      imagePlacementNotes: imagePlacementNotes.trim() || null,
      tone: tone.trim() || null,
      audience: audience.trim() || null,
      targetLength,
      markReviewReady,
    });
  };

  const isRunning =
    createJobMutation.isPending ||
    jobQuery.data?.status === "PENDING" ||
    jobQuery.data?.status === "RUNNING";
  const mediaImages = mediaImagesQuery.isSuccess ? mediaImagesQuery.data : [];

  return (
    <div className="mx-auto max-w-[980px] pt-8">
      <section className="mb-8">
        <p className="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">일반 블로그</p>
        <h1 className="mb-2 text-3xl font-bold text-gray-950 dark:text-white">AI 초안 생성</h1>
        <p className="max-w-2xl text-gray-600 dark:text-zinc-400">
          메모, 키워드, 사진 설명을 바탕으로 일반 블로그 초안을 생성합니다.
        </p>
      </section>

      <form className="rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900" onSubmit={handleSubmit}>
        <div className="mb-5 flex items-center gap-3">
          <AlignLeft className="text-blue-600" size={22} />
          <h2 className="text-xl font-bold text-gray-950 dark:text-white">작성 정보</h2>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">카테고리</span>
              <select
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                value={category}
                onChange={(event) => setCategory(event.target.value as GeneralBlogCategory)}
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">분량</span>
              <select
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                value={targetLength}
                onChange={(event) => setTargetLength(event.target.value as GeneralBlogLength)}
              >
                {lengthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm text-gray-600 dark:text-zinc-400">
              <input checked={markReviewReady} type="checkbox" onChange={(event) => setMarkReviewReady(event.target.checked)} />
              생성 후 검토 대기로 전환
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">제목 힌트</span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                value={titleHint}
                onChange={(event) => setTitleHint(event.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">장소/제품명</span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                value={placeName}
                onChange={(event) => setPlaceName(event.target.value)}
              />
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">주소 힌트</span>
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={addressHint}
              onChange={(event) => setAddressHint(event.target.value)}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">메모</span>
            <textarea
              className="min-h-32 w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">필수 문구</span>
              <textarea
                className="min-h-20 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                value={requiredPhrasesText}
                onChange={(event) => setRequiredPhrasesText(event.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">키워드</span>
              <textarea
                className="min-h-20 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                value={keywordsText}
                onChange={(event) => setKeywordsText(event.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">톤</span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                value={tone}
                onChange={(event) => setTone(event.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">대상 독자</span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
              />
            </label>
          </div>

          <section className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ImagePlus className="text-blue-600" size={18} />
                <h3 className="text-sm font-bold text-gray-950 dark:text-white">사진 정보</h3>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                title="사진 입력 추가"
                type="button"
                onClick={() => setPhotos((current) => [...current, { ...emptyPhoto }])}
              >
                <Plus size={14} />
                추가
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-blue-100 bg-white p-4 dark:border-blue-500/20 dark:bg-zinc-900">
              <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h4 className="text-sm font-bold text-gray-950 dark:text-white">여러 사진 업로드</h4>
                  <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-zinc-400">
                    한 번에 올린 사진은 같은 묶음 ID로 저장되고, 글 생성 요청에 자동으로 포함됩니다.
                  </p>
                </div>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={batchFiles.length === 0 || uploadImagesMutation.isPending}
                  title="여러 사진 업로드"
                  type="button"
                  onClick={() => uploadImagesMutation.mutate()}
                >
                  {uploadImagesMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                  {uploadImagesMutation.isPending ? "업로드 중" : "묶음 업로드"}
                </button>
              </div>
              <input
                accept="image/gif,image/jpeg,image/png,image/webp"
                className="w-full rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:file:bg-zinc-900 dark:file:text-zinc-200 dark:focus:ring-blue-500/15"
                multiple
                type="file"
                onChange={(event) => handleBatchFiles(event.target.files)}
              />

              {batchFiles.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {batchFiles.map((file, index) => (
                    <div className="grid gap-2 rounded-lg bg-gray-50 p-3 dark:bg-zinc-950 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]" key={`${file.name}-${index}`}>
                      <p className="truncate text-xs font-semibold text-gray-700 dark:text-zinc-200" title={file.name}>
                        {file.name}
                      </p>
                      <input
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                        placeholder="사진 설명"
                        value={batchMetas[index]?.altText ?? ""}
                        onChange={(event) => updateBatchMeta(index, "altText", event.target.value)}
                      />
                      <input
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
                        placeholder="본문 배치 메모"
                        value={batchMetas[index]?.note ?? ""}
                        onChange={(event) => updateBatchMeta(index, "note", event.target.value)}
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              {photoGroupId ? (
                <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">사진 묶음</p>
                      <p className="mt-1 break-all text-xs text-gray-500 dark:text-zinc-400">{photoGroupId}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">{groupAssets.length}장</span>
                  </div>
                  {groupAssets.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {groupAssets.map((asset) => (
                        <article
                          className="overflow-hidden rounded-lg border border-gray-200 bg-white text-left transition hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/40"
                          key={asset.id}
                        >
                          <img
                            alt={asset.altText || asset.originalFilename}
                            className="h-24 w-full object-cover"
                            src={resolveAssetUrl(asset.publicUrl)}
                          />
                          <div className="p-2">
                            <p className="truncate text-xs font-semibold text-gray-700 dark:text-zinc-200">
                              {asset.altText || asset.originalFilename}
                            </p>
                            {asset.note ? (
                              <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-gray-500 dark:text-zinc-500">
                                {asset.note}
                              </p>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="grid gap-3">
              {photos.map((photo, index) => (
                <div className="grid gap-3 rounded-lg bg-white p-3 dark:bg-zinc-900" key={index}>
                  <div className="flex justify-end">
                    <button
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-red-600 dark:hover:bg-zinc-800"
                      disabled={photos.length === 1}
                      title="사진 입력 삭제"
                      type="button"
                      onClick={() => removePhoto(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <input
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                    placeholder="이미지 URL"
                    value={photo.url ?? ""}
                    onChange={(event) => updatePhoto(index, "url", event.target.value)}
                  />
                  <div className="grid gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-[1fr_auto] md:items-center">
                    <input
                      accept="image/gif,image/jpeg,image/png,image/webp"
                      className="text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:text-gray-700 dark:text-zinc-400 dark:file:bg-zinc-900 dark:file:text-zinc-200"
                      type="file"
                      onChange={(event) =>
                        setPhotoFiles((current) => ({ ...current, [index]: event.target.files?.[0] ?? null }))
                      }
                    />
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!photoFiles[index] || uploadImageMutation.isPending}
                      title="이미지 업로드"
                      type="button"
                      onClick={() => handleUploadPhoto(index)}
                    >
                      {uploadImageMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                      업로드
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                      placeholder="사진 설명"
                      value={photo.description ?? ""}
                      onChange={(event) => updatePhoto(index, "description", event.target.value)}
                    />
                    <input
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                      placeholder="본문 배치 메모"
                      value={photo.placementNote ?? ""}
                      onChange={(event) => updatePhoto(index, "placementNote", event.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            {mediaImages.length > 0 ? (
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">최근 업로드</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {mediaImages.slice(0, 6).map((asset) => (
                    <button
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 text-left text-xs transition hover:border-blue-200 hover:bg-blue-50 dark:border-zinc-800 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10"
                      key={asset.id}
                      title="첫 번째 빈 사진 입력에 사용"
                      type="button"
                      onClick={() => {
                        const targetIndex = photos.findIndex((item) => !item.url);
                        const nextIndex = targetIndex >= 0 ? targetIndex : photos.length;
                        if (targetIndex < 0) {
                          setPhotos((current) => [
                            ...current,
                            {
                              url: asset.publicUrl,
                              description: asset.altText || "",
                              placementNote: asset.note || "",
                            },
                          ]);
                          return;
                        }
                        updatePhoto(nextIndex, "url", asset.publicUrl);
                        if (asset.altText) {
                          updatePhoto(nextIndex, "description", asset.altText);
                        }
                        if (asset.note) {
                          updatePhoto(nextIndex, "placementNote", asset.note);
                        }
                      }}
                    >
                      <span className="truncate text-gray-700 dark:text-zinc-200">{asset.altText || asset.originalFilename}</span>
                      <span className="shrink-0 font-semibold text-blue-600 dark:text-blue-300">사용</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <textarea
              className="mt-3 min-h-16 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-blue-500/15"
              placeholder="이미지 배치 관련 추가 요청"
              value={imagePlacementNotes}
              onChange={(event) => setImagePlacementNotes(event.target.value)}
            />
          </section>

          <AiJobStatusPanel
            job={jobQuery.data}
            isRetrying={retryJobMutation.isPending}
            title="AI 초안 생성"
            onRetry={() => {
              if (jobQuery.data?.retryable) {
                retryJobMutation.mutate(jobQuery.data.id);
              }
            }}
          />

          {createJobMutation.isError ? (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:bg-zinc-950 dark:text-zinc-400">
              요청을 시작하지 못했습니다. 입력값과 서버 상태를 확인해 주세요.
            </p>
          ) : null}

          <div className="flex justify-end">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isRunning}
              title="AI 초안 생성"
              type="submit"
            >
              {isRunning ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />}
              {isRunning ? "생성 중" : "생성"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
