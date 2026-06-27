const Joi = require('joi');

const telephone = Joi.string()
  .pattern(/^\+?[0-9\s\-\.]{7,20}$/)
  .message('{{#label}} doit être un numéro de téléphone valide');

const motDePasse = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .message('{{#label}} doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');

const nom = Joi.string().trim().min(2).max(50);
const prenom = Joi.string().trim().min(2).max(50);
const email = Joi.string().trim().email().lowercase();
const adresse = Joi.string().trim().max(200);
const cin = Joi.string().trim().min(5).max(20);
const rc = Joi.string().trim().max(50);
const ninea = Joi.string().trim().alphanum().min(5).max(15);

// Pagination query params (GET lists)
const paginationQuery = Joi.object({
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
}).unknown(true); // tolère d'autres query params ignorés

// Signature base64 (SignaturePad Flutter)
const signatureBase64 = Joi.string()
  .max(2 * 1024 * 1024) // ~1.5 MB image PNG en base64
  .pattern(/^(data:image\/png;base64,)?[A-Za-z0-9+/]+=*$/)
  .message('Signature invalide (format base64 attendu)');

// UUID v4
const uuid = Joi.string().guid({ version: 'uuidv4' });

module.exports = { telephone, motDePasse, nom, prenom, email, adresse, cin, rc, ninea, paginationQuery, signatureBase64, uuid };
