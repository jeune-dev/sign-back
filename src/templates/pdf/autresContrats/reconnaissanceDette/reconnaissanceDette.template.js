const PDFDocument = require('pdfkit');
const { attachFooter } = require('../../../../utils/pdfFooter');
const { COLORS, drawHeader, drawSection, drawSignatures, resolveImageBuffer, val, today } = require('../../../../utils/pdfDesign');

module.exports = async function reconnaissanceDetteTemplate({ numero_contrat, generateur, autrePartie, contrat }) {
  const [logoBuffer, signatureBuffer1, signatureBuffer2] = await Promise.all([
    resolveImageBuffer(generateur?.logo),
    resolveImageBuffer(contrat?.signature_generateur || generateur?.signature),
    resolveImageBuffer(contrat?.signature_autre_partie || autrePartie?.signature),
  ]);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
    attachFooter(doc);

    drawHeader(doc, {
      logoBuffer,
      titre: 'RECONNAISSANCE DE DETTE',
      numero: numero_contrat,
      date: today(),
    });

    drawSection(doc, { titre: 'ENTRE LES SOUSSIGNÉS' });

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark).text('LE DÉBITEUR :');
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.textDark);
    doc.text(`${val(generateur.nom)} ${val(generateur.prenom)}`);
    doc.text(`CNI : ${val(generateur.carte_identite_national_num)} | Email : ${val(generateur.email)} | Tél : ${val(generateur.telephone)}`);
    doc.text(`Ci-après dénommé « le Débiteur »`);
    doc.moveDown(0.6);

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark).text('LE CRÉANCIER :');
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.textDark);
    doc.text(`${val(autrePartie.nom)} ${val(autrePartie.prenom)}`);
    doc.text(`Email : ${val(autrePartie.email)} | Tél : ${val(autrePartie.telephone)}`);
    doc.text(`Ci-après dénommé « le Créancier »`);
    doc.moveDown(1);

    drawSection(doc, {
      titre: 'ARTICLE 1 – RECONNAISSANCE DE DETTE',
      contenu: `Je reconnais devoir à ${val(autrePartie.nom)} ${val(autrePartie.prenom)} la somme de :\n\n${val(contrat.montant)} ${val(contrat.devise)}\n\nMotif de la dette : ${val(contrat.motif_dette)}`,
    });

    const remboursementText = contrat.remboursement_echelonne
      ? `Le Débiteur s'engage à rembourser au plus tard le ${val(contrat.date_limite_remboursement)}\n\nModalités :\n• Nombre d'échéances : ${val(contrat.nombre_echeances)}\n• Montant par échéance : ${val(contrat.montant_par_echeance)} ${val(contrat.devise)}\n• Fréquence : ${val(contrat.frequence_paiements)}`
      : `Le Débiteur s'engage à rembourser intégralement au plus tard le : ${val(contrat.date_limite_remboursement)}`;

    drawSection(doc, {
      titre: 'ARTICLE 2 – ENGAGEMENT DE REMBOURSEMENT',
      contenu: remboursementText,
    });

    drawSection(doc, {
      titre: 'ARTICLE 3 – RETARD DE PAIEMENT',
      contenu: `Tout retard donnera lieu à des pénalités de retard calculées au taux légal en vigueur.`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 4 – LITIGES',
      contenu: `Les parties conviennent de soumettre tout litige aux juridictions compétentes du Sénégal.`,
    });

    drawSignatures(doc, {
      partie1: 'Le Débiteur',
      partie2: 'Le Créancier',
      dateSignature: today(),
      signatureBuffer1,
      signatureBuffer2,
    });

    doc.end();
  });
};
