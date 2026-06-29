const router = require('express').Router();
const C = require('../../../controllers/professionnel/fichePaie/fichePaie.controller');
const auth = require('../../../middlewares/auth.middleware');
const validate = require('../../../middlewares/validate.middleware');
const { creerFichePaieSchema, paginationQuery } = require('../../../validations/contrats.validation');

router.post('/cree-fiches-paie', auth, validate(creerFichePaieSchema), C.creerFichePaie);
router.get('/mes-fiches-paie', auth, validate(paginationQuery, 'query'), C.getMesFichesPaie);
router.get('/:fichePaieId', auth, C.getFichePaie);
router.get('/:fichePaieId/download', auth, C.telechargerFichePaie);

module.exports = router;