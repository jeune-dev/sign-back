const { Resend } = require('resend');
// Resend initialisé de façon lazy dans la fonction

async function envoyerEmailDette({ emailGenerateur, emailAutrePartie, numero_contrat, montant, devise, pdfBase64 }) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const subject = `Reconnaissance de dette N° ${numero_contrat}`;
    const html = `
      <h2>Reconnaissance de dette</h2>
      <p>Bonjour,</p>
      <p>Veuillez trouver ci-joint la <strong>reconnaissance de dette</strong>.</p>
      <p><strong>Numéro :</strong> ${numero_contrat}</p>
      <p><strong>Montant :</strong> ${montant} ${devise}</p>
      <p>Merci de bien vouloir le conserver.</p>
      <br/><p>Cordialement,<br/>L'équipe SIGN</p>
    `;
    const attachments = [{ filename: `reconnaissance_dette_${numero_contrat}.pdf`, content: pdfBase64, encoding: 'base64', contentType: 'application/pdf' }];

    if (emailGenerateur) await resend.emails.send({ from: 'SIGN <onboarding@resend.dev>', to: emailGenerateur, subject, html, attachments });
    if (emailAutrePartie) await resend.emails.send({ from: 'SIGN <onboarding@resend.dev>', to: emailAutrePartie, subject, html, attachments });
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email dette:', error);
    return false;
  }
}

module.exports = envoyerEmailDette;
