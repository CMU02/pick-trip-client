# Git 규칙

## 브랜치 전략

- `main` 브랜치에는 직접 커밋하지 않는다.
- 모든 작업은 새 브랜치에서 진행한다.
- 한 브랜치에는 하나의 기능 또는 하나의 목적만 포함한다.
- 작업 완료 후 Pull Request를 통해 `main`에 병합한다.

## 브랜치 이름

```text
<타입>/<작업-내용>
```

| 타입 | 사용 시점 | 예시 |
| --- | --- | --- |
| `feat` | 새로운 기능 | `feat/content-card-list` |
| `fix` | 버그 수정 | `fix/itinerary-error-state` |
| `refactor` | 기능 변경 없는 구조 개선 | `refactor/api-client` |
| `docs` | 문서 변경 | `docs/client-rules` |
| `chore` | 설정, 패키지 관리 | `chore/update-biome` |
| `hotfix` | 긴급 수정 | `hotfix/auth-redirect` |

## 커밋 메시지

```text
<타입>(<범위, 선택>): <제목>

(선택) 본문 - 변경 이유와 주요 내용

(선택) 푸터 - 관련 이슈 번호
```

### 타입

| 타입 | 설명 |
| --- | --- |
| `feat` | 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 |
| `style` | 포맷 변경 |
| `refactor` | 구조 개선 |
| `test` | 테스트 추가 또는 수정 |
| `chore` | 기타 작업 |
| `perf` | 성능 개선 |
| `ci` | CI 변경 |
| `release` | 릴리즈 |

### 작성 규칙

- 제목 끝에 마침표를 붙이지 않는다.
- 커밋 메시지는 한국어로 작성한다.
- 하나의 커밋은 하나의 논리 단위만 담는다.
- 민감한 파일은 커밋하지 않는다.

## 커밋 전 확인

```bash
git status
git diff
bun run lint
bun run build
```

스테이징은 관련 파일만 한다.

```bash
git add <file>
git commit -m "docs: 클라이언트 에이전트 문서 추가"
```

## PR 병합

- 모든 리뷰 코멘트가 해결되어야 한다.
- 린트와 빌드가 통과해야 한다.
- 기능 검증 방법을 PR에 남긴다.
- 병합 방식은 Rebase Merge를 기본으로 한다.
