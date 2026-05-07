// 카테고리 관련 API 비즈니스 로직
const { CATEGORIES } = require('../constants/categories');

// GET /api/categories
// 상수로 관리하는 전체 카테고리 목록을 그대로 반환
async function getCategories(req, res, next) {
  try {
    res.json(CATEGORIES);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCategories,
};

