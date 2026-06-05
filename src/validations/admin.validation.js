const Joi = require('joi');
const { telephone, motDePasse, nom, prenom, email, adresse, cin } = require('./common');

const creerAdminSchema = Joi.object({
  nom: nom.required(),
  prenom: prenom.required(),
  email: email.required(),
  mot_de_passe: motDePasse.required(),
  adresse: adresse.optional().allow(''),
  telephone: telephone.optional().allow(''),
  carte_identite_national_num: cin.optional().allow(''),
  role: Joi.string().valid('Admin').default('Admin')
});

module.exports = { creerAdminSchema };
