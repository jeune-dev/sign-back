const { sendEmail } = require('../../../services/resend.service');
const contratEmailTemplate = require('../../../templates/mail/contratEmailTemplate');

async function envoyerContratTravailEmail({ emailSalarie, emailEmployeur, numero_contrat, poste, date_debut, pdfBase64, nomSignature = 'SIGN' }) {
  try {
    const subject = `Contrat de travail N° ${numero_contrat}`;
    const attachment = {
      filename: `contrat_travail_${numero_contrat}.pdf`,
      content: Buffer.from(pdfBase64, 'base64')
    };

    const html = contratEmailTemplate({
      typeDocument: 'Contrat de travail',
      numero: numero_contrat,
      details: [
        { label: 'Numéro', value: numero_contrat },
        { label: 'Poste', value: poste },
        { label: 'Date de début', value: date_debut }
      ],
      nomSignature
    });

    const envois = [];
    if (emailSalarie) envois.push(sendEmail({ to: emailSalarie, subject, html, attachments: [attachment] }));
    if (emailEmployeur) envois.push(sendEmail({ to: emailEmployeur, subject: `Copie — Contrat de travail N° ${numero_contrat}`, html, attachments: [attachment] }));

    await Promise.all(envois);
    return true;
  } catch (error) {
    console.error('Erreur envoi contrat travail:', error);
    return false;
  }
}

module.exports = envoyerContratTravailEmail;
