const PDFDocument = require('pdfkit');
const { attachFooter } = require('../../../utils/pdfFooter');

module.exports = async function quittanceLoyerTemplate(data) {

  const {
    numero_quittance,
    bailleur,
    locataire,
    logement,
    paiement,
    signature_bailleur,
    quittance
  } = data;

  const val = v => v ?? '—';
  const fmtMoyen = v => v === 'ALL' ? 'Tout mode de paiement' : val(v);
  const today = new Date().toLocaleDateString('fr-FR');

  return new Promise((resolve, reject) => {

    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
    attachFooter(doc);

    // =========================
    // HEADER
    // =========================

    // Logo bailleur (si présent)
    if (bailleur.logo && bailleur.logo.trim()) {
      try {
        const raw = bailleur.logo.replace(/^data:image\/[a-z+]+;base64,/i, '');
        const logoBuf = Buffer.from(raw, 'base64');
        doc.image(logoBuf, 40, doc.y, { fit: [60, 60] });
        doc.moveDown(0.5);
      } catch (_) {}
    }

    doc.fontSize(18).text('QUITTANCE DE LOYER', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).text(`N° Quittance : ${numero_quittance}`);
    doc.text(`Date d’émission : ${val(quittance.date_emission)}`);
    doc.moveDown();

    // =========================
    // BAILLEUR
    // =========================
    doc.fontSize(11).text('SECTION — INFORMATIONS SUR LE BAILLEUR');
    doc.moveDown();

    doc.text(`Nom : ${val(bailleur.nom)} ${val(bailleur.prenom)}`);
    doc.text(`Adresse : ${val(bailleur.adresse)}`);
    doc.text(`Téléphone : ${val(bailleur.telephone)}`);
    doc.text(`Email : ${val(bailleur.email)}`);
    doc.moveDown();

    // =========================
    // LOCATAIRE
    // =========================
    doc.text('SECTION — INFORMATIONS SUR LE LOCATAIRE');
    doc.moveDown();

    doc.text(`Nom : ${val(locataire.nom)} ${val(locataire.prenom)}`);
    doc.text(`Téléphone : ${val(locataire.telephone)}`);
    doc.text(`Email : ${val(locataire.email)}`);
    doc.moveDown();

    // =========================
    // LOGEMENT
    // =========================
    doc.text('SECTION — INFORMATIONS SUR LE LOGEMENT');
    doc.moveDown();

    doc.text(`Adresse : ${val(logement.adresse)}`);
    doc.text(`Type de bien : ${val(logement.type_bien)}`);
    doc.moveDown();

    // =========================
    // PAIEMENT
    // =========================
    doc.text('SECTION — INFORMATIONS SUR LE PAIEMENT');
    doc.moveDown();

    doc.text(`Mois concerné : ${val(paiement.mois)} ${val(paiement.annee)}`);
    doc.text(`Montant du loyer : ${val(paiement.montant_loyer)} FCFA`);
    doc.text(`Montant des charges : ${val(paiement.montant_charges)} FCFA`);
    doc.text(`Montant total payé : ${val(paiement.montant_total)} FCFA`);
    doc.text(`Date de paiement : ${val(paiement.date_paiement)}`);
    doc.text(`Mode de paiement : ${fmtMoyen(paiement.mode_paiement)}`);

    doc.text(
      `Paiement complet : ${
        paiement.est_total ? 'Oui' : 'Non'
      }`
    );

    if (!paiement.est_total) {
      doc.text(`Montant payé partiel : ${val(paiement.montant_paye_partiel)} FCFA`);
    }

    doc.text(`Observations : ${val(paiement.observations)}`);
    doc.moveDown();

    // =========================
    // FINALISATION
    // =========================
    doc.text('SECTION — FINALISATION DE LA QUITTANCE');
    doc.moveDown();

    doc.text(`Ville d’émission : ${val(quittance.ville_emission)}`);
    doc.text(`Date : ${val(quittance.date_emission)}`);
    doc.moveDown();

    // =========================
    // SIGNATURE AUTOMATIQUE
    // =========================
    doc.text('Signature du bailleur :');
    doc.moveDown(3);

    doc.text(`${val(bailleur.nom)} ${val(bailleur.prenom)}`);
    doc.moveDown();

    doc.end();
  });
};