// 로컬 시간대 기준 날짜를 "YYYY-MM-DD" 키로 다루는 공용 포매터. UTC 기준인
// toISOString()을 쓰면 시간대에 따라 하루가 밀릴 수 있어, 연/월/일을 각각
// 로컬로 읽어 조립한다(여러 화면이 독립적으로 재구현하던 것을 통합).

/** month는 0-base(Date.getMonth()와 동일)로 받는다. */
export function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Date → "YYYY-MM-DD"(로컬 기준). */
export function dateToKey(date: Date): string {
  return formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
}
