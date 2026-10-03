# SEND Web

SEND의 Next.js 웹과 API 서버입니다. Node.js `24.14.0`을 사용합니다.

```bash
npm ci
# .env.example을 .env.local로 복사하고 로컬 설정을 입력합니다.
npm run dev
```

`npm run typecheck`는 타입을 검사하고 `npm run build`는 운영 빌드를 생성합니다.

운영은 `main` push 시 GitHub Actions가 OCI에 Docker 이미지로 배포합니다. 자세한 구성은 [운영 배포 문서](docs/oci-production.md)를 참고하세요.
