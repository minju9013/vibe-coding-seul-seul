// 서버 실행 엔트리 포인트
// - MongoDB 연결
// - Express 앱(app.js) 불러와 포트 리스닝
require('dotenv').config();

const mongoose = require('mongoose');
const app = require('../app');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vibe_db';
const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    // eslint-disable-next-line no-console
    console.log('MongoDB 연결 성공');

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('서버 시작 중 에러:', err);
    process.exit(1);
  }
}

start();
