const { sendEmail } = require('../../../services/resend.service');
const contratEmailTemplate = require('../../../templates/mail/contratEmailTemplate');
const logger = require('../../../utils/logger');

async function envoyerFichePaieEmail({ emailEmployeur, numero_fiche, nom, mois, annee, salaire_net, pdfBase64, nomSignature = 'SIGN' }) {
  try {
    const subject = `Fiche de paie N° ${numero_fiche} — ${mois} ${annee}`;
    const attachment = {
      filename: `fiche_paie_${numero_fiche}.pdf`,
      content: pdfBase64 ? Buffer.from(pdfBase64, 'base64') : null
    };

    const html = contratEmailTemplate({
      typeDocument: 'Fiche de paie',
      numero: numero_fiche,
      details: [
        { label: 'Numéro', value: numero_fiche },
        { label: 'Salarié', value: nom },
        { label: 'Période', value: `${mois} ${annee}` },
        { label: 'Salaire net', value: `${Number(salaire_net).toLocaleString('fr-FR')} FCFA` }
      ],
      nomSignature
    });

    if (emailEmployeur) {
      await sendEmail({
        to: emailEmployeur,
        subject,
        html,
        attachments: attachment.content ? [attachment] : []
      });
    }

    return true;
  } catch (error) {
    logger.error('Erreur envoi fiche de paie:', error);
    return false;
  }
}

module.exports = envoyerFichePaieEmail;
