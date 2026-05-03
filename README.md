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

MAGI front의 기본 포트 `3333`과 충돌하지 않도록 MiSo Blog Front는 기본 외부 포트를 `8030`으로 사용합니다.
Docker 배포에서는 프론트 nginx가 같은 Docker network의 MiSo Blog Server로 `/api/`, `/media/` 요청을 프록시합니다.

배포 환경 파일을 만듭니다.

```powershell
Copy-Item deploy.env.example .env.deploy
```

`.env.deploy` 예시:

```env
MISO_BLOG_FRONT_PORT=8030
VITE_API_BASE_URL=/
API_UPSTREAM_HOST=miso-blog-server
API_UPSTREAM_PORT=8010
CLIENT_MAX_BODY_SIZE=30m
MISO_BLOG_NETWORK_NAME=miso-blog-network
```

배포 실행:

```powershell
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --build
```

확인:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:8030
```

서버와 함께 배포할 때는 먼저 서버 compose가 `miso-blog-network`를 만들고 `miso-blog-server` 컨테이너를 띄운 뒤 프론트를 배포하는 흐름을 권장합니다.

## 배포 주의사항

- `VITE_API_BASE_URL`은 빌드 시점에 번들에 포함됩니다. API 주소를 바꾸면 이미지를 다시 빌드해야 합니다.
- Docker 배포 기본값은 `VITE_API_BASE_URL=/`입니다. 브라우저는 프론트 origin으로 `/api`를 호출하고, nginx가 서버로 프록시합니다.
- 프로덕션 빌드에서 `VITE_API_BASE_URL=http://localhost:8010`처럼 localhost가 들어오면 브라우저 PC의 localhost를 보게 되므로 `/`로 보정합니다.
- React Router를 사용하므로 nginx 설정에서 모든 화면 경로를 `index.html`로 fallback합니다.
- 서버가 다른 host에 따로 배포되어 있고 nginx 프록시를 쓰지 않는다면 브라우저에서 접근 가능한 API 주소를 `VITE_API_BASE_URL`에 넣어 다시 빌드해야 합니다.
- 인증/알림/로그아웃처럼 서버 API가 없는 기능은 화면에 연결하지 않습니다.

## 배포 후 API가 localhost로 호출될 때

브라우저 개발자 도구에서 `http://localhost:8010/api/... net::ERR_CONNECTION_REFUSED`가 보이면 이전 빌드 산출물이나 오래된 `.env.deploy`이 사용된 상태일 가능성이 큽니다.

확인 순서:

```powershell
Get-Content .env.deploy
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --build --remove-orphans
```

`.env.deploy`의 권장값:

```env
VITE_API_BASE_URL=/
API_UPSTREAM_HOST=miso-blog-server
API_UPSTREAM_PORT=8010
```

프론트 컨테이너만 다시 빌드해도 기존 브라우저 캐시가 남을 수 있으므로, 새로고침 후에도 같으면 브라우저 캐시를 비우고 다시 확인합니다.

## Jenkins 배포

`Jenkinsfile`은 MAGI front와 같은 흐름을 따릅니다.

1. `npm ci`
2. `npm run build`
3. `.env.deploy` 임시 생성
4. Docker network 확인 또는 생성
5. `docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --build --remove-orphans`
6. `.env.deploy` 삭제

Jenkins 환경 변수로 `MISO_BLOG_FRONT_PORT`, `API_UPSTREAM_HOST`, `API_UPSTREAM_PORT`, `MISO_BLOG_NETWORK_NAME`을 바꿀 수 있습니다.
