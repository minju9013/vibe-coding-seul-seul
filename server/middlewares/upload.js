// 업로드 공용 multer 인스턴스 (메모리에 임시 저장 후 Cloudinary 로 흘려보내기 위함)
const multer = require('multer');

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function imageFileFilter(_req, file, cb) {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    const err = new Error('이미지 파일만 업로드할 수 있습니다.');
    err.status = 400;
    return cb(err);
  }
  return cb(null, true);
}

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: imageFileFilter,
});

module.exports = {
  uploadImage,
  MAX_FILE_SIZE_BYTES,
};
