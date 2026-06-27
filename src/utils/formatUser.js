const formatUser = (utilisateur) => ({
  id: utilisateur.id,
  nom: utilisateur.nom,
  prenom: utilisateur.prenom,
  email: utilisateur.email,
  adresse: utilisateur.adresse,
  telephone: utilisateur.telephone,
  photoProfil: utilisateur.photoProfil,
  carte_identite_national_num: utilisateur.carte_identite_national_num,
  role: utilisateur.role,
  permissions: utilisateur.permissions || null,
  logo: utilisateur.logo,
  rc: utilisateur.rc,
  ninea: utilisateur.ninea,
  statut: utilisateur.statut,
  signature: utilisateur.signature,
  nomEntreprise: utilisateur.nomEntreprise,
  adresseEntreprise: utilisateur.adresseEntreprise,
  telephoneEntreprise: utilisateur.telephoneEntreprise,
  emailEntreprise: utilisateur.emailEntreprise
});

module.exports = formatUser;