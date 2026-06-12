const PDFDocument = require('pdfkit');
const { attachFooter } = require('../../../../utils/pdfFooter');
const { COLORS, drawHeader, drawSection, drawSignatures, resolveImageBuffer, val, today } = require('../../../../utils/pdfDesign');

module.exports = async function contratConfidentialiteTemplate({ numero_contrat, generateur, autrePartie, contrat }) {
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
      titre: 'CONTRAT DE CONFIDENTIALITÉ',
      numero: numero_contrat,
      date: today(),
    });

    drawSection(doc, { titre: 'ENTRE LES SOUSSIGNÉS' });

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark).text('PARTIE DIVULGATRICE :');
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.textDark);
    doc.text(`${val(generateur.nom)} ${val(generateur.prenom)} | Email : ${val(generateur.email)}`);
    if (generateur.nomEntreprise) doc.text(`Entreprise : ${val(generateur.nomEntreprise)} | RCCM : ${val(generateur.rc)}`);
    doc.text(`Ci-après dénommée « la Partie Divulgatrice »`);
    doc.moveDown(0.6);

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark).text('PARTIE RÉCEPTRICE :');
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.textDark);
    doc.text(`${val(autrePartie.nom)} ${val(autrePartie.prenom)} | Email : ${val(autrePartie.email)}`);
    if (autrePartie.nomEntreprise) doc.text(`Entreprise : ${val(autrePartie.nomEntreprise)} | RCCM : ${val(autrePartie.rc)}`);
    doc.text(`Ci-après dénommée « la Partie Réceptrice »`);
    doc.moveDown(1);

    drawSection(doc, {
      titre: 'ARTICLE 1 – INFORMATIONS CONFIDENTIELLES',
      contenu: `Type d'informations : ${val(contrat.type_informations)}\n\nNiveau de confidentialité : ${val(contrat.niveau_confidentialite).toUpperCase()}${contrat.documents_concernes ? '\n\nDocuments concernés : ' + val(contrat.documents_concernes) : ''}`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 2 – OBLIGATION DE NON-DIVULGATION',
      contenu: `La Partie Réceptrice s'engage à ne pas divulguer, révéler, transmettre ou utiliser les Informations Confidentielles à d'autres fins.`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 3 – USAGE LIMITÉ',
      contenu: `Les Informations ne peuvent être utilisées que dans le cadre strict de la relation entre les parties.${contrat.personnes_autorisees ? '\n\nPersonnes autorisées : ' + val(contrat.personnes_autorisees) : ''}`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 4 – DURÉE',
      contenu: `La présente obligation est valable pour : ${val(contrat.duree_confidentialite)}`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 5 – RESTITUTION',
      contenu: `À la demande de la Partie Divulgatrice, tous les documents et copies contenant les Informations Confidentielles devront être restitués ou détruits.`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 6 – SANCTIONS EN CAS DE VIOLATION',
      contenu: val(contrat.sanctions_violation),
    });

    drawSignatures(doc, {
      partie1: 'Partie Divulgatrice',
      partie2: 'Partie Réceptrice',
      dateSignature: today(),
      signatureBuffer1,
    });

    doc.end();
  });
};
