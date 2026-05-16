# API 연동 방향

Pick Trip Client는 `CMU02/pick-trip-server`의 API를 호출한다. 클라이언트는 화면 요구사항에 맞는 타입과 상태를 관리하되, 서버 API 계약을 임의로 바꾸지 않는다.

## 기본 원칙

- API base URL은 `NEXT_PUBLIC_API_BASE_URL`로 주입한다.
- 브라우저에서 호출하는 API에는 secret을 포함하지 않는다.
- 서버 전용 토큰이나 비밀키가 필요하면 Route Handler 또는 서버 전용 모듈을 검토한다.
- API 응답 DTO와 화면 ViewModel을 분리한다.
- 서버 오류 응답은 `.agents/docs/error-handling-flow.md` 기준으로 정규화한다.

## 권장 모듈 구조

```text
src/
├── services/
│   ├── apiClient.ts
│   ├── contentService.ts
│   ├── itineraryService.ts
│   └── authService.ts
└── types/
    ├── content.ts
    ├── itinerary.ts
    └── api.ts
```

## 도메인별 예상 API

| 도메인 | 클라이언트 책임 |
| --- | --- |
| `content` | 지역 콘텐츠 목록, 상세, 필터 조건 표시 |
| `basket` | 선택 목록 생성, 수정, 삭제 또는 클라이언트 임시 선택 상태 관리 |
| `itinerary` | 일정 생성 요청, 생성 결과 조회, 저장 |
| `auth` | 로그인 시작, 인증 상태 확인, 토큰 만료 처리 |
| `share` | 공유 링크 생성, 공개 일정 조회 |

## 요청 처리 기준

- GET 요청은 Server Component에서 먼저 처리할 수 있는지 검토한다.
- 사용자 입력, 토글, 폼 제출은 Client Component에서 이벤트 처리 후 API를 호출한다.
- 중복 요청 방지가 필요한 액션은 버튼 disabled, optimistic update, 요청 ID 등을 검토한다.
- 느린 요청은 로딩 UI 또는 Suspense fallback을 제공한다.

## 환경변수

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

`NEXT_PUBLIC_` 값은 브라우저에 노출된다. 다음 값은 절대 넣지 않는다.

- OAuth client secret
- JWT signing key
- 서버 API key
- DB 접속 정보
