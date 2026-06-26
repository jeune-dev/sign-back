const AuthService = require('../services/auth.service');
const logger = require('../utils/logger');
const formatUser = require('../utils/formatUser');

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
};

exports.inscriptionUser = async (req, res) => {
  const {
    nom, prenom, email, mot_de_passe, adresse, telephone,
    carte_identite_national_num, role, rc, ninea,
    nomEntreprise, adresseEntreprise, telephoneEntreprise, emailEntreprise
  } = req.body;

  const photoProfil = req.files?.['photoProfil']?.[0] ?? null;
  const logo        = req.files?.['logo']?.[0]        ?? null;
  const signature   = req.files?.['signature']?.[0]   ?? null;

  try {
    const result = await AuthService.register({
      nom, prenom, email, mot_de_passe, adresse, telephone,
      carte_identite_national_num, photoProfil, role, logo, rc, ninea, signature,
      nomEntreprise, adresseEntreprise, telephoneEntreprise, emailEntreprise
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      data: { utilisateur: formatUser(result.utilisateur) }
    });
  } catch (err) {
    logger.error('Erreur inscription', { email: req.body?.email, message: err.message });
    return res.status(500).json({ success: false, message: "Erreur serveur lors de l'inscription" });
  }
};

exports.login = async (req, res) => {
  const { identifiant, mot_de_passe } = req.body;

  if (!identifiant || !mot_de_passe) {
    return res.status(400).json({ success: false, message: 'Email/Téléphone et mot de passe sont obligatoires' });
  }

  try {
    const result = await AuthService.login({ identifiant, mot_de_passe });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error || result.message });
    }

    // Cookie HttpOnly pour les clients web ; refreshToken aussi dans le body pour l'app mobile Flutter
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTS);

    return res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        token: result.token,
        refreshToken: result.refreshToken,
        utilisateur: formatUser(result.utilisateur)
      }
    });
  } catch (err) {
    logger.error('Erreur connexion', { message: err.message });
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.refresh = async (req, res) => {
  // Accepte le cookie HttpOnly (web) ou le body (mobile Flutter)
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'refreshToken manquant' });
  }

  try {
    const result = await AuthService.refresh({ refreshToken });

    if (!result.success) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ success: false, message: result.error });
    }

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTS);

    return res.status(200).json({
      success: true,
      message: 'Token renouvelé',
      data: {
        token: result.token,
        refreshToken: result.refreshToken
      }
    });
  } catch (err) {
    logger.error('Erreur refresh token', { message: err.message });
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  try {
    await AuthService.logout({ refreshToken });
    res.clearCookie('refreshToken');
    return res.status(200).json({ success: true, message: 'Déconnexion réussie' });
  } catch (err) {
    logger.error('Erreur logout', { message: err.message });
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
