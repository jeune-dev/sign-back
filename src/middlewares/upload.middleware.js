const multer = require('multer');
const { uploadConfig } = require('../config/security');

/**
 * Vérifie les magic bytes (signature binaire) du fichier.
 * Protège contre les exécutables déguisés en image/PDF.
 */
function checkMagicBytes(buffer, mimetype) {
  if (!buffer || buffer.length < 4) return false;

  // PNG : 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return mimetype === 'image/png';
  }
  // JPEG : FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return mimetype === 'image/jpeg';
  }
  // PDF : 25 50 44 46 (%PDF)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return mimetype === 'application/pdf';
  }
  return false;
}

const fileFilter = (req, file, cb) => {
  if (!uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Type de fichier non autorisé'), false);
  }
  cb(null, true);
};

// memoryStorage : fichier en RAM uniquement, jamais écrit sur disque
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: uploadConfig.maxFileSize },
  fileFilter
});

/**
 * Middleware à enchaîner après upload.fields() / upload.single().
 * Valide les magic bytes de chaque fichier uploadé.
 */
const validateMagicBytes = (req, res, next) => {
  const allFiles = [
    ...Object.values(req.files || {}).flat(),
    ...(req.file ? [req.file] : [])
  ];

  for (const file of allFiles) {
    if (!checkMagicBytes(file.buffer, file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Fichier invalide : "${file.originalname}". Le contenu ne correspond pas au type déclaré.`
      });
    }
  }
  next();
};

module.exports = upload;
module.exports.validateMagicBytes = validateMagicBytes;
