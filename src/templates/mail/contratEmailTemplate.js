/**
 * Template HTML partagé pour tous les emails de contrats.
 * @param {Object} opts
 * @param {string} opts.typeDocument   - Ex: "Contrat de bail", "Fiche de paie"
 * @param {string} opts.numero         - Numéro du document
 * @param {Array}  opts.details        - [{ label, value }] lignes de détails
 * @param {string} opts.nomSignature   - nomEntreprise si pro, sinon nom complet
 * @param {string} [opts.messageExtra] - Paragraphe supplémentaire optionnel
 */
module.exports = function contratEmailTemplate({ typeDocument, numero, details = [], nomSignature, messageExtra = '' }) {
  const detailsHtml = details.map(({ label, value }) => `
    <tr>
      <td style="padding:9px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9;white-space:nowrap;width:40%;">${label}</td>
      <td style="padding:9px 14px;font-size:13px;color:#1e293b;font-weight:600;border-bottom:1px solid #f1f5f9;">${value}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.07);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#111111;padding:28px 36px;">
              <p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:1px;">SIGN</p>
              <p style="margin:4px 0 0;font-size:11px;color:#888888;letter-spacing:2px;text-transform:uppercase;">Gestion & Signature électronique</p>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding:36px 36px 28px;color:#1e293b;font-size:15px;line-height:1.7;">

              <p style="margin:0 0 16px;">Bonjour,</p>

              <p style="margin:0 0 16px;">
                Nous vous informons que votre <strong>${typeDocument}</strong>
                <span style="color:#111111;font-weight:bold;">${numero}</span>
                a été généré avec succès.
              </p>

              <!-- Encart pièce jointe -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                <tr>
                  <td style="background:#f8fafc;border-left:4px solid #111111;padding:14px 18px;border-radius:4px;">
                    <p style="margin:0;font-size:14px;color:#475569;">
                      📎 Vous trouverez le document en <strong>pièce jointe</strong> de ce courriel.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Détails -->
              ${details.length > 0 ? `
              <table width="100%" cellpadding="0" cellspacing="0"
                style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:20px 0;">
                ${detailsHtml}
              </table>
              ` : ''}

              ${messageExtra ? `<p style="margin:16px 0;">${messageExtra}</p>` : ''}

              <p style="margin:16px 0 0;">
                Nous vous remercions pour votre confiance et restons à votre disposition
                pour toute information complémentaire.
              </p>

              <!-- Séparateur -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 20px;">
                <tr><td style="border-top:1px solid #e2e8f0;"></td></tr>
              </table>

              <p style="margin:0;font-size:14px;color:#64748b;">
                Cordialement,<br/>
                <strong style="color:#111111;font-size:15px;">L'équipe ${nomSignature}</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:18px 36px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
                © ${new Date().getFullYear()} SIGN — Tous droits réservés ·
                Ce message est confidentiel et destiné uniquement à son destinataire.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;
};
