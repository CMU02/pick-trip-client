# 패키지 매니저 가이드

이 프로젝트는 Bun을 기본 패키지 매니저로 사용한다.

## 설치 확인

```bash
bun --version
node --version
```

## 의존성 설치

```bash
bun install
```

## 스크립트 실행

```bash
bun run dev
bun run build
bun run start
bun run lint
bun run format
```

## 패키지 추가

```bash
bun add <package-name>
bun add -d <package-name>
```

패키지를 추가할 때는 다음을 확인한다.

- Next.js 16과 React 19 호환 여부
- 브라우저 번들 크기
- Server Component에서 사용 가능한지, Client Component 전용인지
- 라이선스와 유지보수 상태

## 패키지 제거

```bash
bun remove <package-name>
```

## lockfile

- `bun.lock`은 Bun이 관리한다.
- 의존성 변경 없이 lockfile만 바뀌면 원인을 확인한다.
- npm, yarn, pnpm lockfile을 새로 추가하지 않는다.

## Windows 참고

PowerShell에서 Bun 설치:

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

설치 후 새 터미널을 열고 `bun --version`을 확인한다.
