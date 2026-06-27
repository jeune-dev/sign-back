'use strict';

const AuthService = require('../services/auth.service');
const formatUser = require('../utils/formatUser');
const asyncHandler = require('../middlewares/asyncHandler');
const { BadRequestError } = require('../errors/AppError');

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

exports.inscriptionUser = asyncHandler(async (req, res) => {
  const {
    nom, prenom, email, mot_de_passe, adresse, telephone,
    carte_identite_national_num, role, rc, ninea,
    nomEntreprise, adresseEntreprise, telephoneEntreprise, emailEntreprise,
  } = req.body;

  const photoProfil = req.files?.['photoProfil']?.[0] ?? null;
  const logo        = req.files?.['logo']?.[0]        ?? null;
  const signature   = req.files?.['signature']?.[0]   ?? null;

  const result = await AuthService.register({
    nom, prenom, email, mot_de_passe, adresse, telephone,
    carte_identite_national_num, photoProfil, role, logo, rc, ninea, signature,
    nomEntreprise, adresseEntreprise, telephoneEntreprise, emailEntreprise,
  });

  if (!result.success) throw new BadRequestError(result.message);

  res.status(201).json({
    success: true,
    message: result.message,
    data: { utilisateur: formatUser(result.utilisateur) },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { identifiant, mot_de_passe } = req.body;

  const result = await AuthService.login({ identifiant, mot_de_passe });
  if (!result.success) throw new BadRequestError(result.error || result.message);

  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTS);
  res.status(200).json({
    success: true,
    message: 'Connexion réussie',
    data: {
      token:        result.token,
      refreshToken: result.refreshToken,
      utilisateur:  formatUser(result.utilisateur),
    },
  });
});

exports.refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken) throw new BadRequestError('refreshToken manquant');

  const result = await AuthService.refresh({ refreshToken });
  if (!result.success) {
    res.clearCookie('refreshToken');
    throw new BadRequestError(result.error || result.message);
  }

  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTS);
  res.status(200).json({
    success: true,
    message: 'Token renouvelé',
    data: { token: result.token, refreshToken: result.refreshToken },
  });
});

exports.logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  await AuthService.logout({ refreshToken });
  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Déconnexion réussie' });
});
