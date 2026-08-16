# 전역 폰트를 Paperlogy로 교체

## Context

현재 `src/app/layout.tsx`는 `next/font/google`의 `Noto_Sans_KR`(본문, 400~700), `Geist`/`Geist_Mono`(라틴/모노, 사용처 없음)를 조합해 쓰고 있다. 사용자가 다운로드한 `Paperlogy-1.001.zip`(9종 굵기 TTF: Thin~Black)로 전체를 교체한다.

## 확인한 사실

- Paperlogy는 Thin(100)~Black(900) 9개 굵기를 개별 TTF로 제공한다. Tailwind의 기본 font-weight 스케일(100~900, 9단계)과 정확히 1:1 대응돼, 각 굵기 유틸리티(`font-medium`, `font-bold` 등)마다 실제 폰트 파일이 매핑되고 브라우저가 페이크 볼드를 합성할 필요가 없다.
- `--font-mono`(`font-mono` 유틸리티)는 코드베이스 어디에서도 실제로 쓰이지 않는다(`grep` 확인). `Geist`/`Geist_Mono`를 제거해도 영향 없음.
- Next.js는 `next/font/local`로 로컬 폰트를 자체 호스팅·최적화한다(`node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md` 확인). `src` 배열에 `{ path, weight, style }`을 나열하는 방식을 그대로 쓴다.

## 구현

- 폰트 파일을 `src/app/fonts/paperlogy/*.ttf`에 배치(Next 공식 예시와 동일한 위치 관례).
- `layout.tsx`에서 `Noto_Sans_KR`/`Geist`/`Geist_Mono` import를 제거하고, `next/font/local`로 9개 굵기를 모두 등록해 기존과 동일한 CSS 변수명 `--font-sans`에 매핑한다(다른 파일 변경 없이 `font-sans` 유틸리티가 자동으로 새 폰트를 쓰게 됨).
- `globals.css`의 `--font-mono: var(--font-geist-mono)`도 `--font-sans`를 가리키도록 정리한다(미사용이지만 참조가 끊기지 않도록).

## 검증

- `bun run lint`, `bun run build`
- 브라우저에서 대시보드/헤더 등 여러 굵기(`font-bold`, `font-semibold`, `font-medium`)가 쓰이는 화면을 확인해 폰트가 정상 적용되는지, 브라우저 개발자도구 Network 탭에서 실제 굵기별 폰트 파일이 로드되는지 확인.
