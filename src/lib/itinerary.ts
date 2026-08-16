export function formatDuration(duration: number) {
  return duration === 0 ? "당일치기" : `${duration}박 ${duration + 1}일`;
}
