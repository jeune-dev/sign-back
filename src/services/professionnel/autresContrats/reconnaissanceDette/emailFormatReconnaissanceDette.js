const { sendEmail } = require('../../../../services/resend.service');
const contratEmailTemplate = require('../../../../templates/mail/contratEmailTemplate');

async function envoyerEmailDette({ emailGenerateur, emailAutrePartie, numero_contrat, montant, devise, pdfBase64, nomSignature = 'SIGN' }) {
  try {
    const subject = `Reconnaissance de dette N° ${numero_contrat}`;
    const attachment = {
      filename: `reconnaissance_dette_${numero_contrat}.pdf`,
      content: Buffer.from(pdfBase64, 'base64')
    };

    const html = contratEmailTemplate({
      typeDocument: 'Reconnaissance de dette',
      numero: numero_contrat,
      details: [
        { label: 'Numéro', value: numero_contrat },
        { label: 'Montant', value: `${Number(montant).toLocaleString('fr-FR')} ${devise}` }
      ],
      nomSignature
    });

    const envois = [];
    if (emailGenerateur) envois.push(sendEmail({ to: emailGenerateur, subject, html, attachments: [attachment] }));
    if (emailAutrePartie) envois.push(sendEmail({ to: emailAutrePartie, subject, html, attachments: [attachment] }));

    await Promise.all(envois);
    return true;
  } catch (error) {
    console.error('Erreur envoi email reconnaissance de dette:', error);
    return false;
  }
}

module.exports = envoyerEmailDette;
