"use client";

import { useState } from "react";

import { ContentImage } from "@/components/ContentImage";
import { Icon } from "@/components/ui/icon";
import { CATEGORY_LABELS, type ContentCategory } from "@/types/content";

interface ContentGalleryProps {
  // 대표 이미지 + 갤러리 이미지를 합친 목록(부모가 계산). 비어 있으면
  // 폴백 히어로만 보여준다.
  images: string[];
  name: string;
  category?: ContentCategory;
}

// 콘텐츠 상세 왼쪽 열의 사진 영역. 사진이 여러 장이면 히어로 양옆 화살표
// (기본 반투명 → 히어로 hover 시 불투명)와 아래 썸네일 클릭으로 넘긴다.
export function ContentGallery({
  images,
  name,
  category,
}: ContentGalleryProps) {
  // 다른 콘텐츠로 이동하면 부모가 key={content.id} 로 remount 하므로 인덱스
  // 초기화를 위한 effect 는 두지 않는다.
  const [index, setIndex] = useState(0);

  const count = images.length;
  const hasMultiple = count > 1;
  const activeIndex = count > 0 ? Math.min(index, count - 1) : 0;

  function move(delta: number) {
    setIndex((i) => (i + delta + count) % count);
  }

  // 기본은 반투명(opacity-40), 히어로에 마우스를 올리거나 버튼이 포커스되면
  // 불투명해진다. 터치 기기(hover 없음)에서도 기본값 덕에 항상 보인다.
  const arrowClass =
    "absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-foreground opacity-40 backdrop-blur-sm transition-opacity hover:bg-white group-hover:opacity-100 focus-visible:opacity-100";

  return (
    <div>
      <div className="group relative aspect-[16/10] overflow-hidden rounded-[24px] bg-muted">
        <ContentImage
          // src 가 바뀌어도 ContentImage 내부 실패 상태가 남지 않도록 remount.
          key={images[activeIndex] ?? "fallback"}
          src={images[activeIndex]}
          alt={hasMultiple ? `${name} 사진 ${activeIndex + 1}` : name}
          category={category}
          size="xl"
          sizes="(max-width: 1024px) 100vw, 720px"
        />

        {category && (
          <span className="absolute top-3.5 left-3.5 rounded-full bg-primary px-3.5 py-1.5 text-[11.5px] font-extrabold text-primary-foreground">
            {CATEGORY_LABELS[category]}
          </span>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="이전 사진"
              onClick={() => move(-1)}
              className={`${arrowClass} left-3`}
            >
              <Icon name="chevron-left" size={20} />
            </button>
            <button
              type="button"
              aria-label="다음 사진"
              onClick={() => move(1)}
              className={`${arrowClass} right-3`}
            >
              <Icon name="chevron-right" size={20} />
            </button>
            <span className="absolute right-3 bottom-3 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-bold text-white">
              {activeIndex + 1} / {count}
            </span>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="mt-2.5 grid grid-cols-4 gap-2.5">
          {images.map((src, i) => (
            <button
              type="button"
              key={src}
              aria-label={`${i + 1}번 사진 보기`}
              aria-current={i === activeIndex}
              onClick={() => setIndex(i)}
              className={`relative aspect-[4/3] overflow-hidden rounded-[13px] bg-muted transition-opacity ${
                i === activeIndex
                  ? "ring-2 ring-primary"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <ContentImage
                src={src}
                alt=""
                category={category}
                size="sm"
                sizes="120px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
