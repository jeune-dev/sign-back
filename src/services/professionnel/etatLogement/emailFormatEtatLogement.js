const { sendEmail } = require('../../../services/resend.service');
const contratEmailTemplate = require('../../../templates/mail/contratEmailTemplate');
const logger = require('../../../utils/logger');

async function formatEmailEtatLogement({ locataire, proprietaire, etatLogement, pdfBase64, nomSignature = 'SIGN' }) {
  try {
    const subject = `État des lieux N° ${etatLogement.numero}`;
    const attachment = {
      filename: `etat_lieux_${etatLogement.numero}.pdf`,
      content: Buffer.from(pdfBase64, 'base64')
    };

    const html = contratEmailTemplate({
      typeDocument: `État des lieux ${etatLogement.type || ''}`.trim(),
      numero: etatLogement.numero,
      details: [
        { label: 'Numéro', value: etatLogement.numero },
        { label: 'Adresse', value: etatLogement.adresse },
        { label: 'Type', value: etatLogement.type },
        { label: 'Date', value: etatLogement.date },
        { label: 'Locataire', value: `${locataire.prenom} ${locataire.nom}` },
        { label: 'Propriétaire', value: `${proprietaire.prenom} ${proprietaire.nom}` }
      ],
      nomSignature,
      messageExtra: "Nous vous invitons à conserver ce document pour toute réclamation éventuelle."
    });

    const envois = [];
    if (locataire?.email) envois.push(sendEmail({ to: locataire.email, subject, html, attachments: [attachment] }));
    if (proprietaire?.email) envois.push(sendEmail({ to: proprietaire.email, subject: `Copie — État des lieux N° ${etatLogement.numero}`, html, attachments: [attachment] }));

    await Promise.all(envois);
    return true;
  } catch (error) {
    logger.error('Erreur envoi état logement:', error);
    return false;
  }
}

module.exports = formatEmailEtatLogement;
