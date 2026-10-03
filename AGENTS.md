# AGENTS.md

## 프로젝트

- 한국어로 답변하세요.
- 이 디렉터리는 SEND Next.js 웹 + API 서버입니다.
- Node.js `24.14.0`, MySQL `8.4.8` 기준으로 작업하세요.

## 구조

- 페이지/API 라우트: `pages/`
- 컨트롤러: `src/controllers/`
- 모델: `src/models/`
- 유틸리티: `src/utils/`
- 정적 파일: `public/`
- 데이터베이스: `database/`

## 명령

- 개발 서버 실행: `npm run dev`
- 빌드: `npm run build`
- 운영 시작 명령 확인: `npm run start`
- 타입체크: `npm run typecheck`
- 통합 OCI 운영 배포: `npm run deploy:oci`

## 필수 지침

- 데이터베이스 구조를 파악할 때는 로컬 `.env.local`의 `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` 값을 사용해 MySQL에 접속하고 확인하세요.
- 서버 API 라우트는 `pages/api/`에 작성하고, 공통 비즈니스 로직은 `src/controllers/`, `src/models/`, `src/utils/`로 분리하세요.
- 데이터베이스 DDL은 `database/migrations/`, 쿼리는 `database/queries/`에 작성하세요.
- 테이블명과 컬럼명은 대문자로 작성하세요.
- 환경변수 키 이름은 기존 `.env.production`, `.env.local`과 동일하게 유지하세요. Next.js 기본 로딩을 사용하고 별도 파서나 셸 `source`를 추가하지 마세요.
- 실제 `.env*`, `node_modules/`, 로컬 도구 캐시는 Git 추적 대상에 넣지 마세요.
- 중복 로직을 만들지 말고 기능별 모듈로 분리하세요.
- deprecated 라이브러리를 사용하지 마세요.
- 개발 서버 실행/재시작은 사용자가 직접 수행합니다. 에이전트는 사용자 요청 없이 `npm run dev` 같은 장기 실행 dev 서버 명령을 실행하지 마세요.
- 운영 배포는 `SendQuiz/SendQuiz-WEB`의 `main` push로 GitHub Actions가 ARM64 이미지를 GHCR에 올리고 `trendswhat-prod-1:/opt/sendquiz`의 SEND 웹 컨테이너만 갱신합니다. `/opt/edge`의 공용 Caddy와 다른 서비스 설정을 수정하지 마세요.
- 운영 DB는 기존 Docker MySQL `review-in-korea-mysql:3306`의 `sendquiz` 데이터베이스이며, 전용 계정 `sendquiz_app`을 사용합니다. 웹은 `edge`, `review-in-korea-app` 네트워크에 연결됩니다.
