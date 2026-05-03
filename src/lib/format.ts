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
