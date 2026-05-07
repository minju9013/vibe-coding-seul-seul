const express = require('express');
const { uploadImage: uploadImageMiddleware } = require('../middlewares/upload');
const { uploadImage } = require('../controllers/uploadController');

// 업로드 관련 라우터
const router = express.Router();

// POST /api/uploads/image
router.post('/image', uploadImageMiddleware.single('image'), uploadImage);

module.exports = router;
