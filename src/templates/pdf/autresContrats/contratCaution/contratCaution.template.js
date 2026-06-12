const PDFDocument = require('pdfkit');
const { attachFooter } = require('../../../../utils/pdfFooter');
const { COLORS, drawHeader, drawSection, drawSignatures, resolveImageBuffer, val, today } = require('../../../../utils/pdfDesign');

module.exports = async function contratCautionTemplate({ numero_contrat, generateur, autrePartie, contrat }) {
  const [logoBuffer, signatureBuffer1] = await Promise.all([
    resolveImageBuffer(generateur?.logo),
    resolveImageBuffer(generateur?.signature),
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
      titre: 'CONTRAT DE CAUTION',
      numero: numero_contrat,
      date: today(),
    });

    drawSection(doc, { titre: 'ENTRE LES SOUSSIGNÉS' });

    const creancier = contrat.info_creancier || {};
    const debiteur = contrat.info_debiteur || {};

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark).text('LE CRÉANCIER :');
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.textDark);
    doc.text(`${val(creancier.nom || autrePartie.nom)} ${val(creancier.prenom || autrePartie.prenom)}`);
    doc.text(`Email : ${val(creancier.email || autrePartie.email)} | Tél : ${val(creancier.telephone || autrePartie.telephone)}`);
    doc.text(`Ci-après dénommé « le Créancier »`);
    doc.moveDown(0.6);

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark).text('LE DÉBITEUR :');
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.textDark);
    doc.text(`${val(debiteur.nom)} | Email : ${val(debiteur.email)}`);
    doc.text(`Ci-après dénommé « le Débiteur »`);
    doc.moveDown(0.6);

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark).text('LA CAUTION :');
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.textDark);
    doc.text(`${val(generateur.nom)} ${val(generateur.prenom)}`);
    doc.text(`Email : ${val(generateur.email)} | Tél : ${val(generateur.telephone)}`);
    doc.text(`Ci-après dénommée « la Caution »`);
    doc.moveDown(1);

    drawSection(doc, {
      titre: `ARTICLE 1 – ENGAGEMENT DE CAUTION ${val(contrat.type_caution).toUpperCase()}`,
      contenu: `La Caution se porte garante des obligations du Débiteur envers le Créancier à hauteur de : ${val(contrat.montant_garanti)} FCFA\n\n${contrat.type_caution === 'solidaire' ? 'Il s\'agit d\'une caution SOLIDAIRE : le Créancier peut se retourner directement contre la Caution sans poursuivre le Débiteur.' : 'Il s\'agit d\'une caution SIMPLE : le Créancier doit d\'abord poursuivre le Débiteur.'}`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 2 – CONDITIONS ET DURÉE',
      contenu: `Durée de la garantie : ${val(contrat.duree)}\n\nLa présente caution prend effet à compter de la signature du présent acte.`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 3 – RÉSILIATION',
      contenu: `La présente caution prend fin à l'échéance de la durée prévue ou dès que le Débiteur a intégralement rempli ses obligations.`,
    });

    drawSignatures(doc, {
      partie1: 'La Caution',
      partie2: 'Le Créancier',
      dateSignature: today(),
      signatureBuffer1,
    });

    doc.end();
  });
};
