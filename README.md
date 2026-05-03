# MiSo Blog Front

MiSo Blog Front는 MiSo Blog Server와 연결되는 React + Vite 기반 프론트엔드입니다.

## 실행 환경

- Node.js 22 권장
- API 서버 기본 주소: `http://localhost:8010`
- 개발 서버 기본 주소: `http://localhost:5173`

## 로컬 개발

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

`.env.local`에서 API 서버 주소를 바꿀 수 있습니다.

```env
VITE_API_BASE_URL=http://localhost:8010
```

## 빌드 확인

```powershell
npm run build
npm run preview
```

`dist` 폴더가 배포 산출물입니다.

## Docker 배포

배포 환경 파일을 만듭니다.

```powershell
Copy-Item deploy.env.example .env.deploy
```

`.env.deploy` 예시:

```env
MISO_BLOG_FRONT_PORT=8020
VITE_API_BASE_URL=http://localhost:8010
```

배포 실행:

```powershell
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --build
```

확인:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:8020
```

## 배포 주의사항

- `VITE_API_BASE_URL`은 빌드 시점에 번들에 포함됩니다. API 주소를 바꾸면 이미지를 다시 빌드해야 합니다.
- React Router를 사용하므로 nginx 설정에서 모든 화면 경로를 `index.html`로 fallback합니다.
- 서버가 다른 host에 배포되어 있다면 브라우저에서 접근 가능한 API 주소를 `VITE_API_BASE_URL`에 넣어야 합니다.
- 인증/알림/로그아웃처럼 서버 API가 없는 기능은 화면에 연결하지 않습니다.
