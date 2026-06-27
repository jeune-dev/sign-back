const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const checkActiveUser = require('../../middlewares/checkActiveUser.middleware');
const validate = require('../../middlewares/validate.middleware');
const { creerDocumentSchema, mettreAJourDocumentSchema, paginationQuery } = require('../../validations/contrats.validation');
const gestionDocumentController = require('../../controllers/professionnel/generationrapport.controller');

router.post('/creer-document', auth, checkActiveUser, validate(creerDocumentSchema), gestionDocumentController.creerDocument);
router.get('/mes-documents', auth, checkActiveUser, validate(paginationQuery, 'query'), gestionDocumentController.getMesDocuments);
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
  validate(mettreAJourDocumentSchema),
  gestionDocumentController.mettreAJourFacture
);

router.post(
  '/:id/renvoyer-facture',
  auth,
  checkActiveUser,
  gestionDocumentController.renvoyerFacture
);

module.exports = router;
