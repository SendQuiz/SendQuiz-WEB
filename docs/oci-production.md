# 운영 배포

저장소: https://github.com/SendQuiz/SendQuiz-WEB

`main` push 또는 `npm run deploy:oci`로 GitHub Actions 배포를 실행합니다.

1. 타입체크 후 GitHub ARM64 러너에서 Docker 이미지를 빌드합니다.
2. `ghcr.io/sendquiz/sendquiz-web`에 이미지를 올립니다.
3. GitHub Actions Secrets로 `/opt/sendquiz/.env.production`을 생성합니다.
4. OCI가 이미지 digest로 이미지를 내려받아 DB 마이그레이션을 실행합니다.
5. SEND 웹 컨테이너만 갱신하고 컨테이너 상태 및 공개 HTTPS 응답을 확인합니다.

운영 서버는 `trendswhat-prod-1` (`168.107.48.58`)입니다. 공용 `/opt/edge` Caddy가 `sendquiz.net`, `www.sendquiz.net`을 `send-web:3000`으로 전달합니다. 배포는 공용 Caddy나 다른 서비스 설정을 변경하지 않습니다.

DB는 `review-in-korea-mysql:3306`의 `sendquiz`이며 전용 계정 `sendquiz_app`을 사용합니다. 웹은 외부 `edge`, `review-in-korea-app` Docker 네트워크에 연결됩니다. 기존 MySQL 컨테이너와 데이터 볼륨을 공유하지만 Review in Korea의 DB와 계정은 변경하지 않습니다.

`.env.production`의 각 키는 같은 이름의 저장소 Actions Secret으로 등록합니다. SSH 키와 호스트 키는 `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS` Secrets에 저장합니다. `DEPLOY_HOST`, `DEPLOY_USER`는 Actions Variables입니다. 배포에서 생성한 환경파일은 접근 권한 `600`을 사용하며, 소스·빌드 컨텍스트·이미지에 포함하지 않습니다. GHCR 인증은 실행 중에만 임시 Docker 설정 디렉터리를 사용합니다.

로컬 개발은 `npm run dev`를 사용합니다. Next.js가 `.env.local`을 자동 로드합니다. `.env.local`은 로컬 운영 빌드에서도 `.env.production`보다 우선하므로 운영 빌드는 `.env*`가 제외된 Docker 컨텍스트에서 실행합니다. 독립 DB 마이그레이션은 공식 `@next/env` 로더를 사용합니다.

DB 마이그레이션은 현재 `sendquiz_app`으로 실행하므로 해당 DB의 DDL 권한이 필요합니다. 기존 마이그레이션을 변경하지 말고 새 파일을 추가하세요. 동일 MySQL 인스턴스의 장애·볼륨·백업은 두 서비스가 공유합니다.
