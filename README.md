# Pick Trip Client

## 프로젝트 소개

Pick Trip Client는 하동, 영주, 예천처럼 상대적으로 덜 알려진 국내 지역의 음식, 축제, 관광지, 문화 및 자연 콘텐츠를 탐색하고 여행 일정 생성 흐름으로 연결하는 웹 클라이언트입니다.

사용자는 지역 콘텐츠를 둘러보고 원하는 장소를 선택한 뒤, 여행 날짜와 동행 조건에 맞는 AI 기반 일정 생성 결과를 확인할 수 있습니다. 이 저장소는 Pick Trip 서비스의 브라우저 사용자 경험, 화면 라우팅, 서버 API 연동, 반응형 UI를 담당합니다.

## 프로젝트 배경

국내 여행자는 유명 관광지 중심으로 정보를 찾는 경우가 많습니다. 하동, 영주, 예천처럼 고유한 음식, 자연, 문화, 축제 자원을 가진 지역은 정보가 흩어져 있어 처음 방문하는 사용자가 매력을 한눈에 파악하기 어렵습니다.

Pick Trip은 지역 콘텐츠 탐색과 AI 일정 생성을 하나의 흐름으로 연결해, 사용자가 직접 고른 콘텐츠를 실제 이동 동선과 일정으로 확장하는 것을 목표로 합니다.

## 기술 스택

| 분류 | 기술 |
| --- | --- |
| 언어 | TypeScript 5 |
| 프레임워크 | Next.js 16.2.6 App Router |
| UI | React 19.2.4 |
| 스타일링 | Tailwind CSS 4 |
| 패키지 매니저 | Bun |
| 린터 / 포맷터 | Biome 2.2.0 |
| 컴파일 최적화 | React Compiler |

## Quick Start

```bash
bun install
bun run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 주요 스크립트

```bash
bun run dev      # 개발 서버 실행
bun run build    # 프로덕션 빌드
bun run start    # 빌드 결과 실행
bun run lint     # Biome 검사
bun run format   # Biome 포맷 적용
```

## 디렉터리 구조

```text
.
├── public/              # 정적 에셋
├── src/
│   └── app/             # Next.js App Router
│       ├── globals.css  # Tailwind v4 및 전역 스타일
│       ├── layout.tsx   # 루트 레이아웃과 메타데이터
│       └── page.tsx     # 홈 라우트
├── next.config.ts       # Next.js 설정
├── biome.json           # Biome 규칙
├── package.json         # 스크립트 및 의존성
└── tsconfig.json        # TypeScript 설정 및 @/* alias
```

## 프로젝트 문서

| 제목 | 경로 |
| --- | --- |
| 핵심 기능 | `.agents/docs/key-features.md` |
| 주요 사용 흐름 | `.agents/docs/key-usage-flow.md` |
| MVP 범위 | `.agents/docs/mvp-scope.md` |
| 지역별 콘텐츠 방향 | `.agents/docs/content-direction-by-region.md` |
| API 연동 방향 | `.agents/docs/api-integration.md` |
| 예외 처리 흐름 | `.agents/docs/error-handling-flow.md` |
| 정보 보안 보완 방안 | `.agents/docs/measures-to-enhance-information-security.md` |
| 패키지 매니저 가이드 | `.agents/docs/package-manager-guide.md` |

## 컨벤션

| 제목 | 경로 |
| --- | --- |
| 코드 규칙 | `.agents/rules/code-convention.md` |
| 테스트 규칙 | `.agents/rules/test-convention.md` |
| Git 규칙 | `.agents/rules/git-convention.md` |
| 브랜치 포커스 | `.agents/rules/branch-focus.md` |

## 기여 방법

기여 방법은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고합니다.
