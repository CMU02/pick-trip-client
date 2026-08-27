"use client";

import Image from "next/image";
import { useState } from "react";

import {
  ContentImageFallback,
  type FallbackSize,
} from "@/components/ContentImageFallback";
import type { ContentCategory } from "@/types/content";

interface Props {
  src: string | null | undefined;
  alt: string;
  category?: ContentCategory | null;
  size: FallbackSize;
  // next/image sizes 힌트. 플레이스홀더에는 쓰이지 않는다.
  sizes?: string;
}

// 콘텐츠 이미지 영역 공통 렌더러. src가 없거나 로드에 실패(404 등)하면
// 같은 카테고리 아이콘 플레이스홀더로 대체한다. 부모가 크기/overflow를
// 관리한다는 전제로 항상 fill로 채운다.
export function ContentImage({ src, alt, category, size, sizes }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <ContentImageFallback category={category} size={size} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes={sizes}
      onError={() => setFailed(true)}
    />
  );
}
