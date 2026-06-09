const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const checkActiveUser = require('../../middlewares/checkActiveUser.middleware');
const gestionDocumentController = require('../../controllers/professionnel/generationrapport.controller');

router.post('/creer-document', auth, checkActiveUser, gestionDocumentController.creerDocument);
router.get('/mes-documents', auth, checkActiveUser, gestionDocumentController.getMesDocuments);
router.get(
  '/telecharger-document/:documentId',
  auth,
  checkActiveUser,
  gestionDocumentController.telechargerDocument
);

router.get(
  '/ouvrir-document/:documentId',
  auth,
  checkActiveUser,
  gestionDocumentController.ouvrirDocument
);

router.patch(
  '/:id/mettre-a-jour',
  auth,
  checkActiveUser,
  gestionDocumentController.mettreAJourFacture
);

module.exports = router;
