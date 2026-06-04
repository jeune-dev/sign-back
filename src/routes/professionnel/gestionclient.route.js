const express = require('express');
const router = express.Router();
const gestionClientController = require('../../controllers/professionnel/gestionclient.controller');
const auth = require('../../middlewares/auth.middleware');
const checkActiveUser = require('../../middlewares/checkActiveUser.middleware');
const upload = require('../../middlewares/upload.middleware');

router.post(
  '/ajout-client',
  auth,
  checkActiveUser,
  upload.single('photoProfil'),
  gestionClientController.ajoutClient
);

router.put(
  '/modifier-client',
  auth,
  checkActiveUser,
  upload.single('photoProfil'),
  gestionClientController.modificationClient
);

router.get(
  '/recherche-client',
  auth,
  checkActiveUser,
  gestionClientController.rechercherClient
);

router.get(
  '/liste-clients',
  auth,
  checkActiveUser,
  gestionClientController.listerClients
);

router.get(
  '/recherche-autre-partie',
  auth,
  gestionClientController.rechercherAutrePartie
);

module.exports = router;
