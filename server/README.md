## 서버 폴더 (Node.js + Express + MongoDB)

이 폴더는 `Node.js`, `Express`, `MongoDB(Mongoose)` 조합으로 만든 기본 API 서버 템플릿입니다.

### 1. 실행 전 준비

- Node.js 20+ 설치
- 로컬 혹은 Atlas에 MongoDB 인스턴스 준비

```bash
cd "server"
npm install
cp .env.example .env
```

### 2. 개발 서버 실행

```bash
npm run dev
```

- 서버: http://localhost:4000
- 헬스체크: GET /
- 핑: GET /api/ping

