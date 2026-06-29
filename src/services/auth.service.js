const crypto = require('crypto');
const Utilisateur = require('../models/utilisateur.model');
const RefreshToken = require('../models/refreshToken.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtConfig, bcryptConfig } = require('../config/security');
const sequelize = require('../config/db');
const { Op } = require('sequelize');
const { uploadImage } = require('../middlewares/uploadService');
const logger = require('../utils/logger');
// Hash constant utilisé pour égaliser le temps de réponse login (anti timing-attack)
// Généré une seule fois avec bcrypt.hash(randomBytes, 12) — jamais comparé à un vrai mot de passe
const DUMMY_HASH = '$2b$12$LmKBP5z6RvWnAnsFOVK9Qeq7C2JKvPAzTq/xz7rJa2Y5m.JnHkTFO';

// ─── Helpers tokens ────────────────────────────────────────────────────────────

function _hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function _generateAccessToken(utilisateur) {
  return jwt.sign(
    { id: utilisateur.id, role: utilisateur.role },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
}

function _generateRefreshToken(utilisateur) {
  return jwt.sign(
    { id: utilisateur.id, type: 'refresh' },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpiresIn }
  );
}

const MAX_REFRESH_TOKENS_PER_USER = 5;

/** Stocke un refresh token dans la DB (hash uniquement), purge les expirés, limite à 5 actifs. */
async function _storeRefreshToken(utilisateurId, refreshToken, transaction) {
  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);

  // Purge des tokens expirés en premier (libère des slots)
  await RefreshToken.destroy({
    where: { utilisateurId, expiresAt: { [Op.lt]: new Date() } },
    transaction
  });

  // Si la limite est atteinte, révoquer le plus ancien token valide
  const activeCount = await RefreshToken.count({ where: { utilisateurId }, transaction });
  if (activeCount >= MAX_REFRESH_TOKENS_PER_USER) {
    const oldest = await RefreshToken.findOne({
      where: { utilisateurId },
      order: [['createdAt', 'ASC']],
      transaction
    });
    if (oldest) await oldest.destroy({ transaction });
  }

  await RefreshToken.create(
    { tokenHash: _hashToken(refreshToken), utilisateurId, expiresAt },
    { transaction }
  );
}

// ─── AuthService ───────────────────────────────────────────────────────────────

class AuthService {

  // -------------------- INSCRIPTION --------------------
  static async register({
    nom,
    prenom,
    email,
    mot_de_passe,
    adresse,
    telephone,
    carte_identite_national_num,
    photoProfil,
    role = 'Particulier',
    logo,
    rc,
    ninea,
    signature,
    nomEntreprise,
    adresseEntreprise,
    telephoneEntreprise,
    emailEntreprise
  }) {
    const ROLES_AUTORISES = ['Particulier', 'Independant', 'Professionnel'];
    if (!ROLES_AUTORISES.includes(role)) {
      return {
        success: false,
        message: "Rôle non autorisé. Seuls Particulier, Indépendant et Professionnel peuvent s'inscrire."
      };
    }

    const cleanRc    = (role === 'Professionnel') ? rc    : null;
    const cleanNinea = (role === 'Professionnel') ? ninea : null;

    const cleanNomEntreprise      = (role === 'Particulier') ? null : nomEntreprise;
    const cleanAdresseEntreprise  = (role === 'Particulier') ? null : adresseEntreprise;
    const cleanTelEntreprise      = (role === 'Particulier') ? null : telephoneEntreprise;
    const cleanEmailEntreprise    = (role === 'Particulier') ? null : emailEntreprise;

    const t = await sequelize.transaction();

    try {
      const emailClean = email.trim().toLowerCase();

      const exist = await Utilisateur.findOne({ where: { email: emailClean }, transaction: t });
      if (exist) { await t.rollback(); return { success: false, message: "Cet email est déjà utilisé" }; }

      if (telephone) {
        const telExist = await Utilisateur.findOne({ where: { telephone }, transaction: t });
        if (telExist) { await t.rollback(); return { success: false, message: "Ce numéro de téléphone est déjà utilisé" }; }
      }

      if (carte_identite_national_num) {
        const cinExist = await Utilisateur.findOne({ where: { carte_identite_national_num }, transaction: t });
        if (cinExist) { await t.rollback(); return { success: false, message: "Ce numéro de carte identite est déjà utilisé" }; }
      }

      if (cleanEmailEntreprise) {
        const emailEntrepriseExist = await Utilisateur.findOne({ where: { emailEntreprise: cleanEmailEntreprise }, transaction: t });
        if (emailEntrepriseExist) { await t.rollback(); return { success: false, message: "Cet email entreprise est déjà utilisé" }; }
      }

      if (cleanTelEntreprise) {
        const telEntrepriseExist = await Utilisateur.findOne({ where: { telephoneEntreprise: cleanTelEntreprise }, transaction: t });
        if (telEntrepriseExist) { await t.rollback(); return { success: false, message: "Ce téléphone entreprise est déjà utilisé" }; }
      }

      const hashedPassword = await bcrypt.hash(mot_de_passe, bcryptConfig.saltRounds);

      let photoUrl = null;
      if (photoProfil && photoProfil.buffer) photoUrl = await uploadImage(photoProfil.buffer, photoProfil.originalname);

      let logoUrl = null;
      if (logo && logo.buffer) logoUrl = await uploadImage(logo.buffer, logo.originalname);

      let signatureUrl = null;
      if (signature && signature.buffer) signatureUrl = await uploadImage(signature.buffer, signature.originalname);

      const utilisateur = await Utilisateur.create({
        nom, prenom, email: emailClean, mot_de_passe: hashedPassword,
        adresse, telephone, carte_identite_national_num, photoProfil: photoUrl,
        role, logo: logoUrl, rc: cleanRc, ninea: cleanNinea, signature: signatureUrl,
        nomEntreprise: cleanNomEntreprise, adresseEntreprise: cleanAdresseEntreprise,
        telephoneEntreprise: cleanTelEntreprise, emailEntreprise: cleanEmailEntreprise,
      }, { transaction: t });

      await t.commit();

      return { success: true, message: "Inscription réussie", utilisateur };

    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // -------------------- CONNEXION --------------------
  static async login({ identifiant, mot_de_passe }) {
    const isEmail = /\S+@\S+\.\S+/.test(identifiant);
    const utilisateur = await Utilisateur.findOne({
      where: isEmail ? { email: identifiant } : { telephone: identifiant },
    });

    if (!utilisateur) {
      // Égaliser le temps de réponse pour éviter l'énumération d'emails par timing
      await bcrypt.compare(mot_de_passe, DUMMY_HASH);
      return { success: false, error: 'Identifiant ou mot de passe incorrect' };
    }

    if (utilisateur.statut !== 'actif')
      return {
        success: false,
        error: `Votre compte est ${utilisateur.statut}. Veuillez contacter le support ou réactiver votre compte.`
      };

    const valid = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
    if (!valid)
      return { success: false, message: 'Identifiant ou mot de passe incorrect' };

    const accessToken  = _generateAccessToken(utilisateur);
    const refreshToken = _generateRefreshToken(utilisateur);

    const t = await sequelize.transaction();
    try {
      await _storeRefreshToken(utilisateur.id, refreshToken, t);
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    return { success: true, token: accessToken, refreshToken, utilisateur };
  }

  // -------------------- REFRESH TOKEN --------------------
  /**
   * Émet une nouvelle paire access + refresh token (rotation).
   * L'ancien refresh token est révoqué immédiatement après usage.
   */
  static async refresh({ refreshToken }) {
    if (!refreshToken) return { success: false, error: 'Refresh token manquant' };

    // 1. Vérifier la signature JWT
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
    } catch (err) {
      return { success: false, error: 'Refresh token invalide ou expiré' };
    }

    if (decoded.type !== 'refresh')
      return { success: false, error: 'Type de token invalide' };

    // 2. Vérifier la présence en DB et l'absence de révocation
    const tokenHash = _hashToken(refreshToken);
    const storedToken = await RefreshToken.findOne({ where: { tokenHash } });

    if (!storedToken)
      return { success: false, error: 'Refresh token inconnu' };

    if (storedToken.revoked)
      return { success: false, error: 'Refresh token révoqué' };

    if (storedToken.expiresAt < new Date())
      return { success: false, error: 'Refresh token expiré' };

    // 3. Charger l'utilisateur
    const utilisateur = await Utilisateur.findByPk(decoded.id);
    if (!utilisateur)
      return { success: false, error: 'Utilisateur introuvable' };

    if (utilisateur.statut !== 'actif')
      return { success: false, error: 'Compte inactif' };

    // 4. Rotation : révoquer l'ancien token, émettre un nouveau couple
    const t = await sequelize.transaction();
    try {
      await storedToken.update({ revoked: true }, { transaction: t });

      const newAccessToken  = _generateAccessToken(utilisateur);
      const newRefreshToken = _generateRefreshToken(utilisateur);
      await _storeRefreshToken(utilisateur.id, newRefreshToken, t);

      await t.commit();

      return { success: true, token: newAccessToken, refreshToken: newRefreshToken };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // -------------------- DÉCONNEXION --------------------
  /** Révoque le refresh token fourni (déconnexion propre). */
  static async logout({ refreshToken }) {
    if (!refreshToken) return { success: true }; // Rien à révoquer

    const tokenHash = _hashToken(refreshToken);
    await RefreshToken.update(
      { revoked: true },
      { where: { tokenHash, revoked: false } }
    );

    return { success: true };
  }
}

module.exports = AuthService;
