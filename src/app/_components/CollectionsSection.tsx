import { TRIP_COURSES } from "@/lib/tripCourses";

import { TripCourseList } from "./TripCourseList";

// 콘텐츠를 뭘 담을지 모르는 사용자를 위한 "짜여 있는 추천 여행 코스" 섹션.
// 섹션 셸(제목·설명)만 서버에서 렌더하고, 바구니 조작과 이동이 필요한 리스트는
// 작은 클라이언트 컴포넌트 <TripCourseList />로 넘긴다. 코스가 하나도 없으면
// 섹션을 통째로 렌더하지 않는다.
export function CollectionsSection() {
  if (TRIP_COURSES.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16">
      <p className="text-[11.5px] font-extrabold tracking-[0.14em] text-primary">
        추천 코스
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-[38px] sm:tracking-[-0.045em]">
        고민되면, 짜여 있는 코스로 시작
      </h2>
      <p className="mt-3 max-w-[520px] text-[14px] break-keep text-muted-foreground">
        장소가 이미 담긴 코스를 고르면 바로 일정 생성 화면으로 넘어갑니다.
        조건과 장소는 다음 화면에서 바꿀 수 있어요.
      </p>

      <TripCourseList />
    </section>
  );
}
