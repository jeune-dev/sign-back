const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const upload = require('../middlewares/upload.middleware');
const { authRateLimit } = require('../middlewares/rateLimit.middleware');
const validate = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema, refreshSchema, logoutSchema } = require('../validations/auth.validation');

const uploadFields = upload.fields([
  { name: 'photoProfil', maxCount: 1 },
  { name: 'logo',        maxCount: 1 },
  { name: 'signature',   maxCount: 1 }
]);

// Upload multer + validation magic bytes enchaînés
const handleUpload = (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ success: false, message: 'Fichier trop volumineux. Taille maximale : 5 MB.' });
      return res.status(400).json({ success: false, message: 'Erreur lors du traitement du fichier' });
    }
    // Vérification magic bytes après traitement multer
    upload.validateMagicBytes(req, res, next);
  });
};

router.post('/register', authRateLimit, handleUpload, validate(registerSchema), authController.inscriptionUser);
router.post('/login',    authRateLimit, validate(loginSchema),                  authController.login);
router.post('/refresh',  authRateLimit, validate(refreshSchema),                authController.refresh);
router.post('/logout',   validate(logoutSchema),                                authController.logout);

module.exports = router;
