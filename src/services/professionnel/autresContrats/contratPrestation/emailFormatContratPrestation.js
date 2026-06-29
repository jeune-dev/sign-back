const { sendEmail } = require('../../../../services/resend.service');
const contratEmailTemplate = require('../../../../templates/mail/contratEmailTemplate');
const logger = require('../../../../utils/logger');

async function envoyerEmailPrestation({ emailGenerateur, emailAutrePartie, numero_contrat, titre, pdfBase64, nomSignature = 'SIGN' }) {
  try {
    const subject = `Contrat de prestation N° ${numero_contrat}`;
    const attachment = {
      filename: `contrat_prestation_${numero_contrat}.pdf`,
      content: Buffer.from(pdfBase64, 'base64')
    };

    const html = contratEmailTemplate({
      typeDocument: 'Contrat de prestation de services',
      numero: numero_contrat,
      details: [
        { label: 'Numéro', value: numero_contrat },
        { label: 'Objet', value: titre }
      ],
      nomSignature
    });

    const envois = [];
    if (emailGenerateur) envois.push(sendEmail({ to: emailGenerateur, subject, html, attachments: [attachment] }));
    if (emailAutrePartie) envois.push(sendEmail({ to: emailAutrePartie, subject, html, attachments: [attachment] }));

    await Promise.all(envois);
    return true;
  } catch (error) {
    logger.error('Erreur envoi email prestation:', error);
    return false;
  }
}

module.exports = envoyerEmailPrestation;
