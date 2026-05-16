# 기여 가이드 (Contributing Guide)

Pick Trip Client에 기여해주셔서 감사합니다.
이 문서는 프로젝트에 처음 참여하는 팀원을 위해 개발 환경 설정부터 PR 제출까지 단계별로 안내합니다.

---

## 목차

1. [프로젝트 기술 스택](#1-프로젝트-기술-스택)
2. [개발 환경 설정](#2-개발-환경-설정)
3. [디렉터리 구조](#3-디렉터리-구조)
4. [브랜치 전략](#4-브랜치-전략)
5. [커밋 메시지 규칙](#5-커밋-메시지-규칙)
6. [코드 스타일](#6-코드-스타일)
7. [Pull Request 가이드](#7-pull-request-가이드)
8. [이슈 작성 가이드](#8-이슈-작성-가이드)

---

## 1. 프로젝트 기술 스택

| 분류 | 기술 |
| --- | --- |
| 언어 | TypeScript 5 |
| 프레임워크 | Next.js 16.2.6 App Router |
| UI | React 19.2.4 |
| 스타일링 | Tailwind CSS 4 |
| 패키지 매니저 | Bun |
| 린터 / 포맷터 | Biome 2.2.0 |
| 컴파일 최적화 | React Compiler |

---

## 2. 개발 환경 설정

### 2-1. 필수 도구 설치

| 도구 | 설치 방법 |
| --- | --- |
| Node.js | [nodejs.org](https://nodejs.org) LTS 권장 |
| Bun | 아래 macOS/Linux 명령어 참고 |
| Bun | 아래 Windows PowerShell 명령어 참고 |
| Git | [git-scm.com](https://git-scm.com) |

설치 후 아래 명령어로 정상 설치 여부를 확인합니다.

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash
```

```powershell
# Windows PowerShell
powershell -c "irm bun.sh/install.ps1 | iex"
```

```bash
node --version
bun --version
git --version
```

> 자세한 명령어는 `.agents/docs/package-manager-guide.md`를 참고하세요.

### 2-2. 저장소 포크

1. [https://github.com/CMU02/pick-trip-client](https://github.com/CMU02/pick-trip-client)에 접속합니다.
2. 우측 상단의 **Fork** 버튼을 클릭하고 본인의 GitHub 계정을 대상으로 선택합니다.

### 2-3. 로컬 환경 설정

```bash
# 1. 포크한 저장소 클론
git clone git@github.com:<your-github-username>/pick-trip-client.git
cd pick-trip-client

# 2. 원본 저장소를 upstream으로 등록
git remote add upstream git@github.com:CMU02/pick-trip-client.git

# 3. 의존성 설치
bun install
```

### 2-4. 환경 변수 설정

서버 API URL처럼 브라우저에 공개 가능한 값은 `.env.local`에 `NEXT_PUBLIC_` 접두사로 작성합니다.

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

> `.env.local`은 Git에 커밋하지 않습니다.
> secret, OAuth client secret, 서버 API key는 클라이언트 환경변수에 넣지 않습니다.

### 2-5. 코드 동기화

```bash
git fetch --all
git checkout main
git pull upstream main
git checkout feat/content-list
git rebase main
```

> 이미 원격에 push한 브랜치는 rebase 대신 merge를 사용하세요.

### 2-6. 개발 서버 실행

```bash
bun run dev
```

실행 후 [http://localhost:3000](http://localhost:3000)에서 확인합니다.

### 2-7. 주요 스크립트

```bash
bun run dev      # 개발 서버 실행
bun run build    # 프로덕션 빌드
bun run start    # 빌드 결과 실행
bun run lint     # Biome 검사
bun run format   # Biome 포맷 적용
```

---

## 3. 디렉터리 구조

```text
src/
└── app/
    ├── globals.css  # Tailwind v4 및 전역 스타일
    ├── layout.tsx   # 루트 레이아웃과 메타데이터
    └── page.tsx     # 홈 라우트
```

기능 확장 시 권장 구조는 다음과 같습니다.

```text
src/
├── app/              # App Router 라우트와 route-level UI
├── components/       # 여러 라우트에서 공유하는 UI 컴포넌트
├── hooks/            # 클라이언트 커스텀 훅
├── lib/              # 범용 유틸, 서버/클라이언트 공통 모듈
├── services/         # API 호출과 응답 변환
├── types/            # 도메인 타입
└── constants/        # 지역 코드, API 경로 등 상수
```

새 파일은 역할에 맞는 디렉터리에 배치합니다. 특정 라우트에서만 쓰는 UI는 해당 라우트 내부 `_components` 폴더에 둡니다.

---

## 4. 브랜치 전략

### 기본 규칙

- `main` 브랜치에는 직접 커밋하지 않습니다.
- 모든 작업은 새 브랜치를 생성하여 진행합니다.
- 작업이 완료되면 Pull Request를 통해 `main`에 병합합니다.
- 한 브랜치에서는 해당 기능과 관련된 작업만 진행합니다.

### 브랜치 이름 형식

```text
<타입>/<작업-내용>
```

| 타입 | 사용 시점 | 예시 |
| --- | --- | --- |
| `feat` | 새로운 기능 개발 | `feat/content-card-list` |
| `fix` | 버그 수정 | `fix/date-picker-error` |
| `refactor` | 기능 변경 없이 구조 개선 | `refactor/api-client` |
| `docs` | 문서 변경 | `docs/client-agent-rules` |
| `chore` | 설정, 패키지 관리 등 기타 작업 | `chore/biome-config` |
| `hotfix` | 배포된 버전의 긴급 버그 수정 | `hotfix/auth-redirect` |

### 브랜치 생성 예시

```bash
git checkout main
git pull origin main
git checkout -b feat/content-card-list
```

---

## 5. 커밋 메시지 규칙

### 기본 형식

```text
<타입>(<범위, 선택>): <제목>

(선택) 본문 - 변경 이유와 주요 내용

(선택) 푸터 - 관련 이슈 번호 (예: Closes #12)
```

### 타입 종류

| 타입 | 설명 |
| --- | --- |
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 |
| `style` | 코드 포맷 변경 |
| `refactor` | 기능 변경 없는 코드 구조 개선 |
| `test` | 테스트 추가 또는 수정 |
| `chore` | 빌드 설정, 패키지 관리 등 기타 작업 |
| `perf` | 성능 개선 |
| `ci` | CI 설정 및 스크립트 변경 |
| `release` | 버전 릴리즈 및 태그 |

### 작성 규칙

- 제목은 마침표 없이 작성합니다.
- 커밋 메시지는 한국어로 작성합니다.
- 하나의 커밋은 하나의 논리적 단위만 포함합니다.
- `.env.local`, 인증 키, secret은 절대 커밋하지 않습니다.
- 라우트 구조, API 계약, 환경변수 변경은 커밋 본문에 이유를 적습니다.

### 예시

```text
feat(content): 지역 콘텐츠 카드 목록 추가

- 지역별 콘텐츠 카드 컴포넌트 추가
- 서버 콘텐츠 목록 API 응답 타입 정의
- 빈 상태와 로딩 상태 처리

Closes #5
```

---

## 6. 코드 스타일

전체 코드 컨벤션은 `.agents/rules/code-convention.md`를 참고하세요.

### 핵심 규칙

| 항목 | 규칙 | 예시 |
| --- | --- | --- |
| 컴포넌트 파일 / 이름 | PascalCase | `ContentCard.tsx` |
| 함수 / 변수 | camelCase | `fetchContents`, `isLoading` |
| 전역 상수 | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE` |
| 런타임 상수 | camelCase | `baseUrl` |
| 이벤트 핸들러 | handle + 동작 | `handleSubmit` |
| Props 타입 | 컴포넌트명 + Props | `ContentCardProps` |

### Next.js 규칙

- `page.tsx`, `layout.tsx`는 기본적으로 Server Component로 유지합니다.
- 상호작용이 필요한 작은 컴포넌트에만 `"use client"`를 추가합니다.
- 브라우저 API는 Client Component 또는 effect 내부에서만 사용합니다.
- 서버 secret은 클라이언트 컴포넌트로 전달하지 않습니다.
- 라우트 추가 전 `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`를 확인합니다.

### Biome 검사

PR 제출 전 반드시 아래 명령어를 실행합니다.

```bash
bun run lint
bun run build
```

---

## 7. Pull Request 가이드

### PR 제출 전 체크리스트

- [ ] `bun run lint` 실행 후 오류 없음
- [ ] `bun run build` 실행 후 오류 없음
- [ ] 변경 사항이 현재 브랜치의 기능 범위 안에 있음
- [ ] `main` 브랜치의 최신 변경사항을 반영함
- [ ] `.env.local`, secret, 토큰이 포함되지 않음
- [ ] PR 제목과 설명이 명확하게 작성됨

### PR 제목 형식

```text
<타입>: <변경 내용 요약>
```

예시:

- `feat: 지역 콘텐츠 카드 목록 추가`
- `fix: 일정 생성 오류 메시지 처리 개선`
- `docs: 클라이언트 개발 규칙 문서 추가`

### PR 본문 템플릿

```text
## <PR 제목>
- [기능/버그/개선/환경...] 에 대한 한 줄 요약

---

## 변경 목적
왜 이 변경이 필요한지 한두 문장으로 작성해주세요.
관련 이슈 번호가 있다면 함께 적어주세요. (예: 이슈: #5)

---

## 변경 내용
주요 변경 파일과 내용을 간단히 적어주세요.
- src/components/content/ContentCard.tsx: 콘텐츠 카드 UI 추가
- src/services/contentService.ts: 콘텐츠 목록 API 호출 추가

---

## API 변경 여부
- [ ] API 추가 / 변경 있음
- [ ] 환경변수 추가 / 변경 있음
- [ ] 해당 없음

---

## 테스트 및 검증 방법
실제로 어떻게 테스트했는지 적어주세요.
- bun run lint 통과
- bun run build 통과
- 로컬에서 콘텐츠 목록 렌더링 확인

---

## 리뷰 요청 포인트
리뷰어에게 특히 확인받고 싶은 부분을 적어주세요.
- Server Component와 Client Component 경계가 적절한지
```

### 리뷰 과정

1. PR 생성 후 팀원에게 리뷰를 요청합니다.
2. 리뷰어는 코드 스타일뿐 아니라 로직, 접근성, 성능, 유지보수성을 함께 검토합니다.
3. 코멘트는 구체적으로 작성하고 감정적인 표현은 지양합니다.
4. 모든 코멘트가 해결되면 `main`으로 Rebase Merge합니다.

### 병합 기준

- 린트와 빌드가 통과해야 합니다.
- 모든 리뷰 코멘트가 해결되어야 합니다.
- 기능 검증이 필요한 변경은 검증 방법을 PR에 포함합니다.
- 머지 후 관련 이슈를 닫고 작업 브랜치를 정리합니다.

---

## 8. 이슈 작성 가이드

버그를 발견하거나 새 기능을 제안할 때 이슈를 작성합니다.
새 이슈를 작성하기 전에 기존 이슈를 먼저 검색해주세요.

### 버그 리포트

```text
## 버그 설명
어떤 문제가 발생했나요?

## 재현 방법
1. ...
2. ...

## 예상 동작
어떻게 동작해야 하나요?

## 실제 동작
실제로는 어떻게 동작했나요?

## 환경
- OS: (예: macOS 14, Windows 11)
- Browser: (예: Chrome 124)
- Node: (예: 20.x)
- Next.js: 16.2.6
```

### 기능 제안

```text
## 기능 설명
어떤 기능을 원하나요?

## 필요한 이유
왜 이 기능이 필요한가요?

## 구현 아이디어 (선택)
어떻게 구현하면 좋을지 아이디어가 있다면 작성해주세요.
```

---

궁금한 점이 있으면 팀 채널에 질문해주세요.
