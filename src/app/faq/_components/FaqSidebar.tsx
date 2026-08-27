import { Icon } from "@/components/ui/icon";

import { CONTACT_EMAIL } from "../_lib/faqs";

const MAILTO = `mailto:${CONTACT_EMAIL}`;

export function FaqSidebar() {
  return (
    <aside className="flex flex-col gap-[14px] lg:sticky lg:top-[86px]">
      <section className="rounded-[22px] bg-[linear-gradient(140deg,oklch(0.63_0.2_30),oklch(0.51_0.19_14))] p-6 text-white">
        <h2 className="font-heading text-[18px] font-bold tracking-[-0.03em]">
          찾는 답이 없나요?
        </h2>
        <p className="mt-2 text-[12.5px] leading-[1.6] text-white/85">
          궁금한 점을 이메일로 보내주시면
          <br />
          평일 09:00 – 18:00 사이에 답변드립니다.
        </p>
        <a
          href={MAILTO}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center rounded-[13px] bg-white px-4 py-3 text-[13.5px] font-bold text-[oklch(0.52_0.19_28)] transition-colors hover:bg-white/90"
        >
          서비스 문의하기
        </a>
        <p className="mt-2 text-center text-[12px] text-white/80">
          {CONTACT_EMAIL}
        </p>
      </section>

      {/* TODO: 콘텐츠 오류 신고용 구글 폼이 준비되면 링크를 폼 URL로 교체한다. */}
      <section className="rounded-[18px] border border-[oklch(0.93_0.012_30)] border-l-[3px] border-l-primary bg-white p-5">
        <h2 className="text-[13.5px] font-bold tracking-[-0.02em] text-foreground">
          정보가 실제와 다른가요?
        </h2>
        <p className="mt-1.5 text-[12px] leading-[1.6] text-[oklch(0.5_0.015_30)]">
          장소의 영업시간·주소 등이 잘못되어 있다면 알려주세요. 확인 후
          반영합니다.
        </p>
        <a
          href={MAILTO}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-primary transition-colors hover:text-[oklch(0.52_0.19_28)]"
        >
          콘텐츠 정보 오류 신고
          <Icon name="external-link" size={13} />
        </a>
      </section>

      <section className="rounded-[18px] bg-[oklch(0.99_0.006_30)] p-5">
        <p className="text-[11.5px] font-extrabold tracking-[0.1em] text-[oklch(0.5_0.06_30)]">
          DATA SOURCE
        </p>
        <p className="mt-2 text-[12px] leading-[1.7] text-[oklch(0.48_0.015_30)]">
          한국관광공사 TourAPI 및 공공데이터포털의 관광 정보를 활용합니다.
        </p>
      </section>
    </aside>
  );
}
