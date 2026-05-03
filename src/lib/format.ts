export function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function statusLabel(value?: string) {
  if (!value) {
    return "Offline";
  }
  return value.replace(/_/g, " ").toLowerCase();
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
