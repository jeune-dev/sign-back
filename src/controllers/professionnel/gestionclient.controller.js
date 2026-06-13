const GestionClientService = require('../../services/professionnel/gestionclient.service');
const logger = require('../../utils/logger');

// -------------------- RECHERCHE CLIENT --------------------
exports.rechercherClient = async (req, res) => {
  try {
    const {
      carte_identite_national_num,
      telephone,
      nom,
      prenom,
      email
    } = req.query;

    const result = await GestionClientService.rechercherClient({
      carte_identite_national_num,
      telephone,
      nom,
      prenom,
      email
    });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json(result);

  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// -------------------- RECHERCHE AUTRE PARTIE --------------------
exports.rechercherAutrePartie = async (req, res) => {
  try {
    const { rc, carte_identite_national_num, telephone, nom, email } = req.query;
    const result = await GestionClientService.rechercherAutrePartie({ rc, carte_identite_national_num, telephone, nom, email });
    if (result.error) return res.status(400).json({ error: result.error });
    return res.status(200).json(result);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// -------------------- LISTE DES CLIENTS (PAGINATION) --------------------
exports.listerClients = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const professionnelId = req.user.id;

    const result = await GestionClientService.listerClients({
      page,
      limit,
      professionnelId
    });

    return res.status(200).json(result);

  } catch (error) {
    logger.error('Erreur controller listerClients:', error);
    return res.status(500).json({
      message: 'Erreur serveur lors de la récupération des clients'
    });
  }
};
