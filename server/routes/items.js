const express = require('express');
const {
  getItems,
  createItem,
  updateItem,
  deleteItem,
} = require('../controllers/itemController');

// 품목(Item) 관련 라우터
const router = express.Router();

// GET /api/items
router.get('/', getItems);

// POST /api/items
router.post('/', createItem);

// PUT /api/items/:id
router.put('/:id', updateItem);

// DELETE /api/items/:id
router.delete('/:id', deleteItem);

module.exports = router;

