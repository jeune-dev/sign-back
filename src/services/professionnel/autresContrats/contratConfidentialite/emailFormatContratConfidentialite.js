const { sendEmail } = require('../../../../services/resend.service');
const contratEmailTemplate = require('../../../../templates/mail/contratEmailTemplate');

async function envoyerEmailConfidentialite({ emailGenerateur, emailAutrePartie, numero_contrat, niveau, pdfBase64, nomSignature = 'SIGN' }) {
  try {
    const subject = `Accord de confidentialité N° ${numero_contrat}`;
    const attachment = {
      filename: `contrat_confidentialite_${numero_contrat}.pdf`,
      content: Buffer.from(pdfBase64, 'base64')
    };

    const html = contratEmailTemplate({
      typeDocument: 'Accord de confidentialité',
      numero: numero_contrat,
      details: [
        { label: 'Numéro', value: numero_contrat },
        { label: 'Niveau de confidentialité', value: niveau }
      ],
      nomSignature
    });

    const envois = [];
    if (emailGenerateur) envois.push(sendEmail({ to: emailGenerateur, subject, html, attachments: [attachment] }));
    if (emailAutrePartie) envois.push(sendEmail({ to: emailAutrePartie, subject, html, attachments: [attachment] }));

    await Promise.all(envois);
    return true;
  } catch (error) {
    console.error('Erreur envoi email confidentialité:', error);
    return false;
  }
}

module.exports = envoyerEmailConfidentialite;
