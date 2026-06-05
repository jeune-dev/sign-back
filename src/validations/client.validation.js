const Joi = require('joi');
const { telephone, motDePasse, nom, prenom, email, adresse, cin } = require('./common');

const creerClientSchema = Joi.object({
  nom: nom.required(),
  prenom: prenom.required(),
  email: email.required(),
  mot_de_passe: motDePasse.required(),
  adresse: adresse.optional().allow(''),
  telephone: telephone.optional().allow(''),
  carte_identite_national_num: cin.optional().allow(''),
  role: Joi.string().valid('Particulier', 'Professionnel', 'Independant').default('Particulier')
});

const modifierClientSchema = Joi.object({
  nom: nom.optional(),
  prenom: prenom.optional(),
  email: email.optional(),
  telephone: telephone.optional().allow(''),
  adresse: adresse.optional().allow(''),
  carte_identite_national_num: cin.optional().allow('')
}).min(1).message('Au moins un champ doit être fourni');

module.exports = { creerClientSchema, modifierClientSchema };
