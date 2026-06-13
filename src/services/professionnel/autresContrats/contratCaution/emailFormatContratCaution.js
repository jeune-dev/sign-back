const { sendEmail } = require('../../../../services/resend.service');
const contratEmailTemplate = require('../../../../templates/mail/contratEmailTemplate');

async function envoyerEmailCaution({ emailGenerateur, emailAutrePartie, numero_contrat, montant, pdfBase64, nomSignature = 'SIGN' }) {
  try {
    const subject = `Contrat de caution N° ${numero_contrat}`;
    const attachment = {
      filename: `contrat_caution_${numero_contrat}.pdf`,
      content: Buffer.from(pdfBase64, 'base64')
    };

    const html = contratEmailTemplate({
      typeDocument: 'Contrat de caution',
      numero: numero_contrat,
      details: [
        { label: 'Numéro', value: numero_contrat },
        { label: 'Montant garanti', value: `${Number(montant).toLocaleString('fr-FR')} FCFA` }
      ],
      nomSignature
    });

    const envois = [];
    if (emailGenerateur) envois.push(sendEmail({ to: emailGenerateur, subject, html, attachments: [attachment] }));
    if (emailAutrePartie) envois.push(sendEmail({ to: emailAutrePartie, subject, html, attachments: [attachment] }));

    await Promise.all(envois);
    return true;
  } catch (error) {
    console.error('Erreur envoi email caution:', error);
    return false;
  }
}

module.exports = envoyerEmailCaution;
