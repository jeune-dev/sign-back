const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const upload = require('../middlewares/upload.middleware');
const auth = require('../middlewares/auth.middleware');
const checkActiveUser = require('../middlewares/checkActiveUser.middleware');
const { authRateLimit } = require('../middlewares/rateLimit.middleware');
const validate = require('../middlewares/validate.middleware');
const { forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, modifierProfilSchema } = require('../validations/account.validation');

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

router.get('/me', auth, accountController.me);

router.put(
  '/modifier-info-personnelles',
  auth,
  handleUpload,
  validate(modifierProfilSchema),
  accountController.modifierInfoPersonnelles
);

router.post(
  '/forgot-password',
  authRateLimit,
  validate(forgotPasswordSchema),
  accountController.forgotPassword
);

router.post(
  '/reset-password',
  authRateLimit,
  validate(resetPasswordSchema),
  accountController.resetPassword
);

router.put(
  '/change-password',
  auth,
  checkActiveUser,
  validate(changePasswordSchema),
  accountController.changePassword
);

router.put(
  '/deactivate-account',
  auth,
  checkActiveUser,
  accountController.deactivateAccount
);

router.put(
  '/activate-account',
  auth,
  accountController.activateAccount
);

router.put(
  '/toggle-account-status',
  auth,
  accountController.toggleAccountStatus
);

module.exports = router;
