const express = require('express');
const router = express.Router();
const gestionAdminController = require('../../controllers/admin/gestionAdmin.controller');
const adminMiddleware = require('../../middlewares/admin.middleware');
const requirePermission = require('../../middlewares/permission.middleware');
const { adminRateLimit } = require('../../middlewares/rateLimit.middleware');
const upload = require('../../middlewares/upload.middleware');
const validate = require('../../middlewares/validate.middleware');
const { creerAdminSchema } = require('../../validations/admin.validation');
const { modifierPermissionsSchema, paginationQuery } = require('../../validations/contrats.validation');

const handleUpload = (req, res, next) => {
  upload.single('photoProfil')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Fichier trop volumineux. Taille maximale : 5 MB.' });
    }
    return res.status(400).json({ message: 'Erreur lors du traitement du fichier' });
  });
};

router.get('/nombre-admins', adminMiddleware, adminRateLimit, requirePermission('admins'), gestionAdminController.nombreAdmin);
router.post('/ajout-admins', adminMiddleware, adminRateLimit, requirePermission('admins'), handleUpload, validate(creerAdminSchema), gestionAdminController.ajoutAdmin);
router.get('/liste-admins', adminMiddleware, adminRateLimit, requirePermission('admins'), validate(paginationQuery, 'query'), gestionAdminController.listeAdmin);
router.patch('/admins/:id/permissions', adminMiddleware, adminRateLimit, requirePermission('admins'), validate(modifierPermissionsSchema), gestionAdminController.modifierPermissions);

module.exports = router;
