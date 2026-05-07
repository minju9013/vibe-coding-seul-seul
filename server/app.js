// Express 애플리케이션 설정 및 라우터 등록
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const categoryRoutes = require('./routes/categories');
const itemRoutes = require('./routes/items');
const stockRoutes = require('./routes/stocks');
const uploadRoutes = require('./routes/uploads');
const preferencesRoutes = require('./routes/preferences');

const app = express();

// 공통 미들웨어
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 헬스 체크
app.get('/', (req, res) => {
  res.json({ message: 'API 서버가 정상 동작 중입니다' });
});

// 간단 핑 엔드포인트
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, time: new Date() });
});

// 도메인별 라우터 등록
app.use('/api/categories', categoryRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/preferences', preferencesRoutes);

// 공통 에러 핸들러
// 컨트롤러에서 next(err) 로 넘긴 에러를 여기서 한 번에 처리
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // 개발 중 디버깅에 도움이 되도록 서버 콘솔에 출력
  // 실제 프로덕션에서는 로깅 도구로 보내는 것이 좋다.
  // eslint-disable-next-line no-console
  console.error(err);

  const status = err.status || 500;
  const message = err.message || '서버 내부 오류가 발생했습니다.';

  res.status(status).json({ message });
});

module.exports = app;

