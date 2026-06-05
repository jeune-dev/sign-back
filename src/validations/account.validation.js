const Joi = require('joi');
const { telephone, motDePasse, nom, prenom, email, adresse, cin, rc, ninea } = require('./common');

const forgotPasswordSchema = Joi.object({
  email: email.required()
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: motDePasse.required()
});

const modifierProfilSchema = Joi.object({
  nom: nom.optional(),
  prenom: prenom.optional(),
  email: email.optional(),
  telephone: telephone.optional().allow(''),
  adresse: adresse.optional().allow(''),
  carte_identite_national_num: cin.optional().allow(''),
  rc: rc.optional().allow('', null),
  ninea: ninea.optional().allow('', null),
  nomEntreprise: Joi.string().trim().max(100).optional().allow('', null),
  adresseEntreprise: adresse.optional().allow('', null),
  telephoneEntreprise: telephone.optional().allow('', null),
  emailEntreprise: email.optional().allow('', null)
}).min(1).message('Au moins un champ doit être fourni');

module.exports = { forgotPasswordSchema, changePasswordSchema, modifierProfilSchema };
