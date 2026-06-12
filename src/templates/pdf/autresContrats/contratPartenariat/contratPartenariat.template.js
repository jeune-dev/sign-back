const PDFDocument = require('pdfkit');
const { attachFooter } = require('../../../../utils/pdfFooter');
const { COLORS, drawHeader, drawSection, drawSignatures, resolveImageBuffer, val, today } = require('../../../../utils/pdfDesign');

module.exports = async function contratPartenariatTemplate({ numero_contrat, generateur, autrePartie, contrat }) {
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
      titre: 'CONTRAT DE PARTENARIAT',
      numero: numero_contrat,
      date: today(),
    });

    drawSection(doc, { titre: 'ENTRE LES SOUSSIGNÉS' });

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark).text('PARTENAIRE 1 :');
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.textDark);
    doc.text(`${val(generateur.nom)} ${val(generateur.prenom)} | Email : ${val(generateur.email)}`);
    if (generateur.nomEntreprise) doc.text(`Entreprise : ${val(generateur.nomEntreprise)} | RCCM : ${val(generateur.rc)}`);
    doc.text(`Ci-après dénommé « Partenaire 1 »`);
    doc.moveDown(0.6);

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark).text('PARTENAIRE 2 :');
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.textDark);
    doc.text(`${val(autrePartie.nom)} ${val(autrePartie.prenom)} | Email : ${val(autrePartie.email)}`);
    if (autrePartie.nomEntreprise) doc.text(`Entreprise : ${val(autrePartie.nomEntreprise)} | RCCM : ${val(autrePartie.rc)}`);
    doc.text(`Ci-après dénommé « Partenaire 2 »`);
    doc.moveDown(1);

    drawSection(doc, {
      titre: 'ARTICLE 1 – OBJET DU PARTENARIAT',
      contenu: val(contrat.objet_partenariat),
    });

    drawSection(doc, {
      titre: 'ARTICLE 2 – DURÉE',
      contenu: val(contrat.duree),
    });

    drawSection(doc, {
      titre: 'ARTICLE 3 – RESPONSABILITÉS',
      contenu: `P1 : ${val(contrat.responsabilites_partie1)}\n\nP2 : ${val(contrat.responsabilites_partie2)}`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 4 – CONTRIBUTIONS',
      contenu: `P1 : ${val(contrat.contribution_partie1)}\n\nP2 : ${val(contrat.contribution_partie2)}`,
    });

    if (contrat.partage_revenus) {
      drawSection(doc, {
        titre: 'ARTICLE 5 – PARTAGE DES REVENUS',
        contenu: `P1 : ${val(contrat.pourcentage_partie1)}% | P2 : ${val(contrat.pourcentage_partie2)}%`,
      });
    }

    drawSection(doc, {
      titre: 'ARTICLE 6 – CONFIDENTIALITÉ',
      contenu: `Les parties s'engagent à maintenir confidentielle toute information relative au partenariat.`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 7 – NON-CONCURRENCE',
      contenu: `Les parties s'interdisent d'exercer toute activité concurrente durant le partenariat.`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 8 – RÉSILIATION',
      contenu: `Chaque partie peut résilier moyennant 30 jours en cas de manquement grave.`,
    });

    drawSignatures(doc, {
      partie1: 'Partenaire 1',
      partie2: 'Partenaire 2',
      dateSignature: today(),
      signatureBuffer1,
    });

    doc.end();
  });
};
