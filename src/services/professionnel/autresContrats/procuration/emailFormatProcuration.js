const { sendEmail } = require('../../../../services/resend.service');
const contratEmailTemplate = require('../../../../templates/mail/contratEmailTemplate');
const logger = require('../../../../utils/logger');

async function envoyerEmailProcuration({ emailMandant, emailMandataire, numero_contrat, objet, pdfBase64, nomSignature = 'SIGN' }) {
  try {
    const subject = `Procuration N° ${numero_contrat}`;
    const attachment = {
      filename: `procuration_${numero_contrat}.pdf`,
      content: Buffer.from(pdfBase64, 'base64')
    };

    const html = contratEmailTemplate({
      typeDocument: 'Procuration',
      numero: numero_contrat,
      details: [
        { label: 'Numéro', value: numero_contrat },
        { label: 'Objet', value: objet }
      ],
      nomSignature
    });

    const envois = [];
    if (emailMandant) envois.push(sendEmail({ to: emailMandant, subject, html, attachments: [attachment] }));
    if (emailMandataire) envois.push(sendEmail({ to: emailMandataire, subject, html, attachments: [attachment] }));

    await Promise.all(envois);
    return true;
  } catch (error) {
    logger.error('Erreur envoi email procuration:', error);
    return false;
  }
}

module.exports = envoyerEmailProcuration;
