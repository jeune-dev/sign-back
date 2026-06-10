const Joi = require('joi');
const { telephone, motDePasse, nom, prenom, email, adresse, cin, rc, ninea } = require('./common');

const registerSchema = Joi.object({
  nom: nom.required(),
  prenom: prenom.required(),
  email: email.required(),
  mot_de_passe: motDePasse.required(),
  adresse: adresse.optional().allow(''),
  telephone: telephone.optional().allow(''),
  carte_identite_national_num: cin.optional().allow(''),
  role: Joi.string().valid('Particulier', 'Professionnel', 'Independant').default('Particulier'),
  rc: rc.optional().allow('', null),
  ninea: ninea.optional().allow('', null),
  nomEntreprise: Joi.string().trim().max(100).optional().allow('', null),
  adresseEntreprise: adresse.optional().allow('', null),
  telephoneEntreprise: telephone.optional().allow('', null),
  emailEntreprise: email.optional().allow('', null)
});

const loginSchema = Joi.object({
  identifiant: Joi.string().trim().required(),
  mot_de_passe: Joi.string().required()
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const logoutSchema = Joi.object({
  refreshToken: Joi.string().optional().allow('', null)
});

module.exports = { registerSchema, loginSchema, refreshSchema, logoutSchema };
