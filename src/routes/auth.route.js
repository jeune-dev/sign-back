const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const { authRateLimit } = require('../middlewares/rateLimit.middleware');
const validate = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema } = require('../validations/auth.validation');

const uploadFields = upload.fields([
  { name: 'photoProfil', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'signature', maxCount: 1 }
]);

const handleUpload = (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Fichier trop volumineux. Taille maximale : 5 MB.' });
    }
    return res.status(400).json({ message: 'Erreur lors du traitement du fichier' });
  });
};

router.post('/register', handleUpload, validate(registerSchema), authController.inscriptionUser);
router.post('/login', authRateLimit, validate(loginSchema), authController.login);

router.get('/hello', authController.hello);
module.exports = router;
