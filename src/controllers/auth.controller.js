const AuthService = require('../services/auth.service');
const logger = require('../utils/logger');
const formatUser = require('../utils/formatUser');

exports.inscriptionUser = async (req, res) => {
  const {
    nom, prenom, email, mot_de_passe, adresse, telephone,
    carte_identite_national_num, role, rc, ninea,
    nomEntreprise, adresseEntreprise, telephoneEntreprise, emailEntreprise
  } = req.body;

  const photoProfil = req.files['photoProfil'] ? req.files['photoProfil'][0] : null;
  const logo        = req.files['logo']        ? req.files['logo'][0]        : null;
  const signature   = req.files['signature']   ? req.files['signature'][0]   : null;

  try {
    const result = await AuthService.register({
      nom, prenom, email, mot_de_passe, adresse, telephone,
      carte_identite_national_num, photoProfil, role, logo, rc, ninea, signature,
      nomEntreprise, adresseEntreprise, telephoneEntreprise, emailEntreprise
    });

    if (!result.success) return res.status(400).json({ message: result.message });

    return res.status(201).json({
      message: result.message,
      utilisateur: formatUser(result.utilisateur)
    });
  } catch (err) {
    logger.error("Erreur lors de l'inscription :", err);
    return res.status(500).json({ message: "Erreur serveur lors de l'inscription" });
  }
};

exports.login = async (req, res) => {
  const { identifiant, mot_de_passe } = req.body;

  if (!identifiant || !mot_de_passe)
    return res.status(400).json({ message: 'Email/Téléphone et mot de passe sont obligatoires' });

  try {
    const result = await AuthService.login({ identifiant, mot_de_passe });

    if (!result.success)
      return res.status(400).json({ message: result.error || result.message });

    return res.status(200).json({
      token:        result.token,
      refreshToken: result.refreshToken,
      utilisateur:  formatUser(result.utilisateur)
    });
  } catch (err) {
    logger.error('Erreur connexion:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * POST /auth/refresh
 * Body : { refreshToken: "..." }
 * Response : { token, refreshToken }
 *
 * Implémente la rotation : l'ancien refresh token est révoqué, un nouveau couple est émis.
 */
exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(400).json({ message: 'refreshToken manquant' });

  try {
    const result = await AuthService.refresh({ refreshToken });

    if (!result.success)
      return res.status(401).json({ message: result.error });

    return res.status(200).json({
      token:        result.token,
      refreshToken: result.refreshToken
    });
  } catch (err) {
    logger.error('Erreur refresh token:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * POST /auth/logout
 * Body : { refreshToken: "..." }
 * Révoque le refresh token pour une déconnexion propre.
 */
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    await AuthService.logout({ refreshToken });
    return res.status(200).json({ message: 'Déconnexion réussie' });
  } catch (err) {
    logger.error('Erreur logout:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.hello = (req, res) => {
  res.status(200).json({ message: 'Hello, world!' });
};
