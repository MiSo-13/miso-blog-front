export function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function statusLabel(value?: string) {
  if (!value) {
    return "대기";
  }

  const labels: Record<string, string> = {
    DRAFT: "초안",
    REVIEW_READY: "검토 대기",
    APPROVED: "승인됨",
    PUBLISHED: "발행됨",
    FAILED: "실패",
    PENDING: "대기 중",
    RUNNING: "진행 중",
    SUCCEEDED: "완료",
  };

  return labels[value] ?? value.replace(/_/g, " ").toLowerCase();
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function readingWordCount(summary?: string | null) {
  return countWords(summary ?? "");
}
