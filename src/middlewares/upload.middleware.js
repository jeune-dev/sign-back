const multer = require('multer');
const { uploadConfig } = require('../config/security');

const fileFilter = (req, file, cb) => {
  if (uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'), false);
  }
};

// memoryStorage : fichier en RAM uniquement, jamais écrit sur disque
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: uploadConfig.maxFileSize },
  fileFilter
});

module.exports = upload;
