// Cloudinary SDK 설정 및 buffer 업로드 헬퍼
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Cloudinary 업로드는 stream API를 쓸 때 가장 자연스럽다.
// multer.memoryStorage 로 받은 Buffer를 그대로 흘려 보낼 수 있도록 Promise 로 감싼다.
function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'joo-seul-seul/items',
        resource_type: 'image',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}

async function destroyFromCloudinary(publicId) {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

module.exports = {
  cloudinary,
  uploadBufferToCloudinary,
  destroyFromCloudinary,
};
