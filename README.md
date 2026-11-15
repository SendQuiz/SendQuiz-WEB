# SEND Web

SEND의 Next.js 16.4.6 App Router 웹과 API 서버입니다. Node.js `24.14.0`을 사용합니다.

```bash
npm ci
# .env.example을 .env.local로 복사하고 로컬 설정을 입력합니다.
npm run dev
```

개발 서버는 `http://localhost:3007`에서 실행합니다. `.env.local`의 `APP_BASE_URL`도 같은 주소를 사용합니다.

`npm run typecheck`는 TypeScript 7로 타입을 검사하고 `npm run build`는 운영 빌드를 생성합니다.
`npm run lint`는 Oxlint 검사, `npm test`는 Vitest 단위 테스트, `npm run test:watch`는 테스트 감시 모드를 실행합니다.
`npm run verify`로 lint·타입 검사·테스트를 함께 실행할 수 있습니다.

운영은 `main` push 시 GitHub Actions가 OCI에 Docker 이미지로 배포합니다. 자세한 구성은 [운영 배포 문서](docs/oci-production.md)를 참고하세요.

## 디렉토리 구조

- `app/`: 페이지, 레이아웃, 스타일, 파일 기반 API Route Handler
- `components/<domain>/`: 인증·고객 지원·홈 화면 UI
- `lib/<domain>/`: 인증·프로필·사용자·퀴즈·피드백·정책 로직
- `lib/http/`: 요청 검증, 인증 가드, 응답 및 오류 처리
- `lib/db/`: MySQL 연결 및 SQL 파일 로더
- `database/`: 마이그레이션과 SQL 쿼리
- `content/`, `public/`: 정책 원문과 정적 파일

소스 파일명은 kebab-case를 사용하고, 내부 모듈은 `@/`로 가져옵니다.
테스트는 대상 코드 옆에 `*-test.ts`로 배치합니다.

API는 `/api/auth/...`, `/api/profile/...`, `/api/quiz/...`, `/api/feedback`을 사용합니다.
이전 `/auth/...`, `/profile/...`, `/quiz/...`, `/feedback` API 별칭과 Pages Router는 제거했습니다.
퀴즈 API는 catch-all 커스텀 라우터 대신 각 경로의 `route.ts`에 HTTP 메서드를 선언합니다.
정책 문서는 `generateStaticParams`로 정적 생성하고, 로그인 페이지는 서버에서 검색 매개변수를 읽어 폼에 전달합니다.
