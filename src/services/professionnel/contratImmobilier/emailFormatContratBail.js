const { sendEmail } = require('../../../services/resend.service');
const contratEmailTemplate = require('../../../templates/mail/contratEmailTemplate');
const logger = require('../../../utils/logger');

async function envoyerContratEmail({ emailsLocataires, emailBailleur, numero_contrat, pdfBase64, nomSignature = 'SIGN' }) {
  try {
    const subject = `Contrat de bail N° ${numero_contrat}`;
    const attachment = {
      filename: `contrat_bail_${numero_contrat}.pdf`,
      content: Buffer.from(pdfBase64, 'base64')
    };

    const html = contratEmailTemplate({
      typeDocument: 'Contrat de bail',
      numero: numero_contrat,
      details: [
        { label: 'Numéro du contrat', value: numero_contrat }
      ],
      nomSignature,
      messageExtra: "Nous vous invitons à conserver précieusement ce document pour vos dossiers."
    });

    const envois = emailsLocataires.map(email =>
      sendEmail({ to: email, subject, html, attachments: [attachment] })
    );

    if (emailBailleur) {
      envois.push(sendEmail({
        to: emailBailleur,
        subject: `Copie du contrat de bail N° ${numero_contrat}`,
        html,
        attachments: [attachment]
      }));
    }

    await Promise.all(envois);
    return true;
  } catch (error) {
    logger.error('Erreur envoi contrat bail:', error);
    return false;
  }
}

module.exports = envoyerContratEmail;
