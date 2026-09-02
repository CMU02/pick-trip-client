# 회원 탈퇴 프론트 연동

- 이슈: CMU02#119
- 브랜치: `feat/119`
- 백엔드: `DELETE /api/v1/users/me` (PR #77 / 백엔드 이슈 #76, main 85250b9, 반영 2026-09-02)

## 배경

백엔드가 회원 탈퇴를 소프트 삭제로 처리한다.

- **D+0**: `deleted=true`, `deleted_at` 기록. 리프레시 토큰 즉시 폐기. 데이터는 보관.
- **D+0 ~ D+30**: 같은 소셜 계정으로 재로그인하면 자동 복구(일정·바구니·찜 유지). 별도 철회 API 없음.
- **D+30 이후**: 매일 04:00 `userPurgeJob`이 계정과 소유 데이터를 하드 삭제. 이후 로그인은 신규 가입.

이미 발급된 액세스 토큰은 최대 1시간 유효하므로 클라이언트가 반드시 지워야 한다.

## API 계약

`DELETE /api/v1/users/me`, `Authorization: Bearer {accessToken}`, 바디 없음.

| 응답 | 의미 | 클라이언트 처리 |
| --- | --- | --- |
| 204 | 탈퇴 처리 완료 | 토큰 삭제 후 홈으로 이동 |
| 401 | 토큰 없음·만료 | 재로그인 유도 |
| 404 `USER_NOT_FOUND` | 이미 하드 삭제된 계정 | 토큰 삭제 후 홈으로 이동 |

멱등: 같은 요청을 두 번 보내도 204, 유예 기간은 최초 탈퇴 시점 기준.

## 변경 사항

### 1. `src/services/authService.ts`

`withdrawUser(accessToken)` 추가 — `apiClient.delete("/api/v1/users/me", { headers: authHeaders(accessToken) })`.

### 2. `src/app/auth/withdraw/route.ts` (신규, POST)

logout 라우트와 동일한 best-effort 구조.

1. `pt_refresh_token` 쿠키 읽기. 없으면 이미 로그아웃 상태 → `{ ok: true }` + 쿠키 삭제.
2. `refreshAccessToken({ refreshToken })`로 **새 액세스 토큰 발급**. 클라 캐시의 stale 토큰(최대 1시간) / 401 문제를 라우트에서 흡수한다.
   - 리프레시 실패 → `{ ok: true }` + 쿠키 삭제(어차피 세션이 죽었으므로 탈퇴 화면에서 홈으로 보낸다).
3. `withdrawUser(accessToken)` 호출.
   - 204 → 성공.
   - 404 (`USER_NOT_FOUND`) → 이미 하드 삭제됨, 성공으로 처리.
   - 그 외(500 등) → 실패. 쿠키 유지, `{ ok: false }`.
4. 성공/404: 리프레시 쿠키 삭제, `{ ok: true }`.

### 3. `src/hooks/useAuth.tsx`

`logout`과 대칭으로 `withdraw(): Promise<boolean>` 추가.

- `/auth/withdraw` POST.
- 응답이 `{ ok: true }`면 세션 쿼리를 `{ accessToken: null, user: null }`로 비우고 `true` 반환.
- `{ ok: false }` 또는 예외면 세션 유지, `false` 반환.

### 4. `src/app/mypage/_components/WithdrawSection.tsx` (신규) + `MyPageClient.tsx` 연결

- 마이페이지 하단 위험 구역 카드.
- 안내: "탈퇴해도 30일 안에 같은 소셜 계정으로 다시 로그인하면 계정이 복구됩니다. 30일이 지나면 저장한 일정·바구니·찜이 모두 삭제됩니다."
- **인라인 2단계 확인**(모달 없음): `회원 탈퇴` → "정말 탈퇴하시겠어요?" + `[취소] [탈퇴하기]`(destructive, 처리 중 disabled).
- 성공 → `router.replace("/")`. 실패 → 인라인 오류 문구.

## 테스트

- `authService.test.ts`: `withdrawUser`가 `DELETE /api/v1/users/me`를 Authorization 헤더와 함께 호출.
- `useAuth.test.tsx`: `withdraw` 성공 시 세션이 비워지고, 실패 시 유지.
- 라우트 테스트: 쿠키 없음 / 204 / 404 / 500 각 분기.

## 범위 밖

- 탈퇴 사유 수집 (백엔드 이번 범위 아님).
- 탈퇴 철회 UI (재로그인으로 자동 처리, 별도 API 없음).
