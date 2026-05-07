// 업로드 관련 비즈니스 로직 (현재는 Cloudinary 이미지 업로드만 다룸)
const { uploadBufferToCloudinary } = require('../utils/cloudinary');

// POST /api/uploads/image
// - multipart/form-data 의 'image' 필드로 파일을 받음
// - 받은 Buffer를 그대로 Cloudinary 로 흘려 보내고
// - 클라이언트가 바로 사용할 수 있도록 secure_url, public_id 만 응답
async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '업로드할 이미지 파일이 없습니다.' });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      filename_override: req.file.originalname,
    });

    res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadImage,
};
