const { Resend } = require('resend');

// Resend initialisé de façon lazy dans la fonction

async function envoyerContratTravailEmail({
  emailSalarie,
  emailEmployeur,
  numero_contrat,
  poste,
  date_debut,
  pdfBase64
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const subject = `Contrat de travail N° ${numero_contrat}`;

    const html = `
      <h2>Contrat de travail</h2>
      <p>Bonjour,</p>
      <p>Veuillez trouver ci-joint votre <strong>contrat de travail</strong>.</p>
      <p><strong>Numéro :</strong> ${numero_contrat}</p>
      <p><strong>Poste :</strong> ${poste}</p>
      <p><strong>Date de début :</strong> ${date_debut}</p>
      <br/>
      <p>Merci de bien vouloir le conserver.</p>
      <br/>
      <p>Cordialement,<br/>L'équipe</p>
    `;

    const attachments = [
      {
        filename: `contrat_${numero_contrat}.pdf`,
        content: pdfBase64,
        encoding: 'base64',
        contentType: 'application/pdf'
      }
    ];

    // 📩 Envoi au salarié
    if (emailSalarie) {
      await resend.emails.send({
        from: 'Contrat Travail <onboarding@resend.dev>',
        to: emailSalarie,
        subject,
        html,
        attachments
      });
    }

    // 📩 Envoi à l’employeur
    if (emailEmployeur) {
      await resend.emails.send({
        from: 'Contrat Travail <onboarding@resend.dev>',
        to: emailEmployeur,
        subject: `Copie du contrat N° ${numero_contrat}`,
        html,
        attachments
      });
    }

    return true;

  } catch (error) {
    console.error("❌ Erreur envoi contrat:", error);
    return false;
  }
}

module.exports = envoyerContratTravailEmail;