const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const {
  authRateLimitConfig,
  mutationRateLimitConfig,
  adminRateLimitConfig,
  otpEmailRateLimitConfig,
} = require('../config/security');

// Auth routes (login, register, refresh) — 5 req / 15 min par IP
const authRateLimit = rateLimit(authRateLimitConfig);

// Mutations sensibles (modifier profil, changer mdp, supprimer compte) — 20 req / 15 min par IP
const mutationRateLimit = rateLimit(mutationRateLimitConfig);

// Routes admin — 200 req / 15 min par IP
const adminRateLimit = rateLimit(adminRateLimitConfig);

// OTP forgot/reset par EMAIL — 3 req / 15 min par email ciblé (anti multi-IP)
// keyGenerator : normalise l'email reçu dans le body pour construire la clé de comptage
const otpEmailRateLimit = rateLimit({
  ...otpEmailRateLimitConfig,
  keyGenerator: (req, res) => {
    const email = (req.body?.email || '').trim().toLowerCase();
    return email || ipKeyGenerator(req, res);
  },
  skip: (req) => {
    // Ne s'applique pas si le body est vide (le validate Joi rejettera la requête après)
    return !req.body?.email;
  },
});

module.exports = { authRateLimit, mutationRateLimit, adminRateLimit, otpEmailRateLimit };
