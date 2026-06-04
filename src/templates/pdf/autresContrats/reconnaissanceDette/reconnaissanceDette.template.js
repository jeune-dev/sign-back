const PDFDocument = require('pdfkit');

module.exports = async function reconnaissanceDetteTemplate({ numero_contrat, generateur, autrePartie, contrat }) {
  const val = v => v ?? '—';
  const today = new Date().toLocaleDateString('fr-FR');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text('RECONNAISSANCE DE DETTE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`N° ${numero_contrat}  |  Date : ${today}`, { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(11).font('Helvetica-Bold').text('ENTRE LES SOUSSIGNÉS :');
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').text('LE DÉBITEUR :');
    doc.font('Helvetica').text(`${val(generateur.nom)} ${val(generateur.prenom)}`);
    doc.text(`CNI : ${val(generateur.carte_identite_national_num)}  |  Email : ${val(generateur.email)}  |  Tél : ${val(generateur.telephone)}`);
    doc.text(`Ci-après dénommé « le Débiteur »`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('LE CRÉANCIER :');
    doc.font('Helvetica').text(`${val(autrePartie.nom)} ${val(autrePartie.prenom)}`);
    doc.text(`Email : ${val(autrePartie.email)}  |  Tél : ${val(autrePartie.telephone)}`);
    doc.text(`Ci-après dénommé « le Créancier »`);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('ARTICLE 1 – RECONNAISSANCE DE DETTE');
    doc.font('Helvetica').text(`Je soussigné(e) ${val(generateur.nom)} ${val(generateur.prenom)}, reconnais devoir à ${val(autrePartie.nom)} ${val(autrePartie.prenom)} la somme de :`);
    doc.moveDown(0.3);
    doc.fontSize(14).font('Helvetica-Bold').text(`${val(contrat.montant)} ${val(contrat.devise)}`, { align: 'center' });
    doc.fontSize(11).font('Helvetica').moveDown(0.5);
    doc.text(`Motif de la dette : ${val(contrat.motif_dette)}`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 2 – ENGAGEMENT DE REMBOURSEMENT');
    doc.font('Helvetica').text(`Le Débiteur s'engage à rembourser intégralement la somme due au plus tard le : ${val(contrat.date_limite_remboursement)}`);

    if (contrat.remboursement_echelonne) {
      doc.moveDown(0.5);
      doc.text(`Modalités d'échelonnement :`);
      doc.text(`- Nombre d'échéances : ${val(contrat.nombre_echeances)}`, { indent: 20 });
      doc.text(`- Montant par échéance : ${val(contrat.montant_par_echeance)} ${val(contrat.devise)}`, { indent: 20 });
      doc.text(`- Fréquence : ${val(contrat.frequence_paiements)}`, { indent: 20 });
    }
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 3 – RETARD DE PAIEMENT');
    doc.font('Helvetica').text(`Tout retard de paiement donnera lieu à des pénalités de retard calculées au taux légal en vigueur au Sénégal.`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 4 – LITIGES');
    doc.font('Helvetica').text(`En cas de litige relatif au présent acte, les parties conviennent de soumettre leur différend aux juridictions compétentes du Sénégal.`);
    doc.moveDown(1.5);

    doc.font('Helvetica').text(`Fait à ${val(contrat.lieu_signature || 'Dakar')}, le ${today}`);
    doc.moveDown(2);
    doc.text('Le Débiteur                               Le Créancier');
    doc.moveDown(3);
    doc.text('Signature :                               Signature :');

    doc.end();
  });
};
