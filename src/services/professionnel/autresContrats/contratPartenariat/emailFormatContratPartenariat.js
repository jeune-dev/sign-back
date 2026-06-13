const { sendEmail } = require('../../../../services/resend.service');
const contratEmailTemplate = require('../../../../templates/mail/contratEmailTemplate');

async function envoyerEmailPartenariat({ emailGenerateur, emailAutrePartie, numero_contrat, objet, pdfBase64, nomSignature = 'SIGN' }) {
  try {
    const subject = `Contrat de partenariat N° ${numero_contrat}`;
    const attachment = {
      filename: `contrat_partenariat_${numero_contrat}.pdf`,
      content: Buffer.from(pdfBase64, 'base64')
    };

    const html = contratEmailTemplate({
      typeDocument: 'Contrat de partenariat',
      numero: numero_contrat,
      details: [
        { label: 'Numéro', value: numero_contrat },
        { label: 'Objet', value: objet }
      ],
      nomSignature
    });

    const envois = [];
    if (emailGenerateur) envois.push(sendEmail({ to: emailGenerateur, subject, html, attachments: [attachment] }));
    if (emailAutrePartie) envois.push(sendEmail({ to: emailAutrePartie, subject, html, attachments: [attachment] }));

    await Promise.all(envois);
    return true;
  } catch (error) {
    console.error('Erreur envoi email partenariat:', error);
    return false;
  }
}

module.exports = envoyerEmailPartenariat;
