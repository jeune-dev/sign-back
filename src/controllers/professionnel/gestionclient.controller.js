const GestionClientService = require('../../services/professionnel/gestionclient.service');
const logger = require('../../utils/logger');

exports.rechercherClient = async (req, res) => {
  try {
    const { carte_identite_national_num, telephone, nom, prenom, email } = req.query;
    const result = await GestionClientService.rechercherClient({ carte_identite_national_num, telephone, nom, prenom, email });
    if (!result.success) return res.status(400).json({ success: false, message: result.message });
    return res.status(200).json({ success: true, message: result.message, data: { utilisateurs: result.data.utilisateurs } });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.rechercherAutrePartie = async (req, res) => {
  try {
    const { rc, carte_identite_national_num, telephone, nom, email } = req.query;
    const result = await GestionClientService.rechercherAutrePartie({ rc, carte_identite_national_num, telephone, nom, email });
    if (!result.success) return res.status(400).json({ success: false, message: result.message });
    return res.status(200).json({ success: true, message: result.message, data: { utilisateurs: result.data.utilisateurs } });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.listerClients = async (req, res) => {
  try {
    const result = await GestionClientService.listerClients({ page: req.query.page || 1, limit: req.query.limit || 10, professionnelId: req.user.id });
    if (!result.success) return res.status(400).json({ success: false, message: result.message });
    return res.status(200).json({ success: true, message: result.message, data: { utilisateurs: result.data.utilisateurs, pagination: result.data.pagination } });
  } catch (error) {
    logger.error('Erreur controller listerClients:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération des clients' });
  }
};
