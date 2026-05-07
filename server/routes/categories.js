const express = require('express');
const { getCategories } = require('../controllers/categoryController');

// 카테고리 관련 라우터
const router = express.Router();

// GET /api/categories
router.get('/', getCategories);

module.exports = router;

