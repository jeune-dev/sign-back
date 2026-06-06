const { Resend } = require('resend');
// Resend initialisé de façon lazy dans la fonction

async function envoyerEmailPrestation({ emailGenerateur, emailAutrePartie, numero_contrat, titre, pdfBase64 }) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const subject = `Contrat de prestation N° ${numero_contrat}`;
    const html = `
      <h2>Contrat de prestation de services</h2>
      <p>Bonjour,</p>
      <p>Veuillez trouver ci-joint votre <strong>contrat de prestation</strong>.</p>
      <p><strong>Numéro :</strong> ${numero_contrat}</p>
      <p><strong>Objet :</strong> ${titre}</p>
      <p>Merci de bien vouloir le conserver.</p>
      <br/><p>Cordialement,<br/>L'équipe SIGN</p>
    `;
    const attachments = [{
      filename: `contrat_prestation_${numero_contrat}.pdf`,
      content: pdfBase64,
      encoding: 'base64',
      contentType: 'application/pdf'
    }];

    if (emailGenerateur) {
      await resend.emails.send({ from: 'SIGN <onboarding@resend.dev>', to: emailGenerateur, subject, html, attachments });
    }
    if (emailAutrePartie) {
      await resend.emails.send({ from: 'SIGN <onboarding@resend.dev>', to: emailAutrePartie, subject, html, attachments });
    }
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email prestation:', error);
    return false;
  }
}

module.exports = envoyerEmailPrestation;
