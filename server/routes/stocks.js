const express = require('express');
const { updateStock } = require('../controllers/stockController');

// 재고(Stock) 관련 라우터
const router = express.Router();

// PUT /api/stocks/:itemId
router.put('/:itemId', updateStock);

module.exports = router;

