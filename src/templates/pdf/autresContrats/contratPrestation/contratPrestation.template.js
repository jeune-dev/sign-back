const PDFDocument = require('pdfkit');
const { attachFooter } = require('../../../../utils/pdfFooter');
const { COLORS, drawHeader, drawSection, drawSignatures, resolveImageBuffer, val, today } = require('../../../../utils/pdfDesign');

module.exports = async function contratPrestationTemplate({ numero_contrat, generateur, autrePartie, contrat }) {
  const [logoBuffer, signatureBuffer1, signatureBuffer2] = await Promise.all([
    resolveImageBuffer(generateur?.logo),
    resolveImageBuffer(generateur?.signature),
    resolveImageBuffer(autrePartie?.signature),
  ]);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
    attachFooter(doc);

    // ── EN-TÊTE ────────────────────────────────────────────
    drawHeader(doc, {
      logoBuffer,
      titre: 'CONTRAT DE PRESTATION DE SERVICES',
      numero: numero_contrat,
      date: today(),
    });

    // ── PARTIES ────────────────────────────────────────────
    drawSection(doc, {
      titre: 'ENTRE LES SOUSSIGNÉS',
    });

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark).text('LE PRESTATAIRE :');
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.textDark);
    doc.text(`${val(generateur.nom)} ${val(generateur.prenom)}`);
    doc.text(`Email : ${val(generateur.email)} | Tél : ${val(generateur.telephone)}`);
    if (generateur.nomEntreprise) {
      doc.text(`Entreprise : ${val(generateur.nomEntreprise)} | RCCM : ${val(generateur.rc)} | NINEA : ${val(generateur.ninea)}`);
    }
    doc.text(`Ci-après dénommé « le Prestataire »`);
    doc.moveDown(0.6);

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark).text('LE CLIENT :');
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.textDark);
    doc.text(`${val(autrePartie.nom)} ${val(autrePartie.prenom)}`);
    doc.text(`Email : ${val(autrePartie.email)} | Tél : ${val(autrePartie.telephone)}`);
    if (autrePartie.nomEntreprise) {
      doc.text(`Entreprise : ${val(autrePartie.nomEntreprise)} | RCCM : ${val(autrePartie.rc)}`);
    }
    doc.text(`Ci-après dénommé « le Client »`);
    doc.moveDown(1);

    // ── ARTICLE 1 ──────────────────────────────────────────
    drawSection(doc, {
      titre: 'ARTICLE 1 – OBJET DE LA PRESTATION',
      contenu: `Le présent contrat a pour objet : ${val(contrat.objet_prestation)}.\n\nType de prestation : ${val(contrat.type_prestation)}\n\nDescription de la mission :\n${val(contrat.description_mission)}`,
    });

    // ── ARTICLE 2 ──────────────────────────────────────────
    drawSection(doc, {
      titre: 'ARTICLE 2 – DURÉE DE LA MISSION',
      contenu: `Durée : ${val(contrat.duree_mission)}\nDate de début : ${val(contrat.date_debut)}\nDate de fin : ${val(contrat.date_fin)}`,
    });

    // ── ARTICLE 3 ──────────────────────────────────────────
    drawSection(doc, {
      titre: 'ARTICLE 3 – RÉMUNÉRATION ET MODE DE PAIEMENT',
      contenu: `Montant total : ${val(contrat.montant_total)} FCFA\nMode de paiement : ${contrat.mode_paiement === 'ALL' ? 'Tout mode de paiement' : val(contrat.mode_paiement)}`,
    });

    // ── ARTICLE 4 ──────────────────────────────────────────
    drawSection(doc, {
      titre: 'ARTICLE 4 – OBLIGATIONS DU PRESTATAIRE',
      contenu: [
        'Le Prestataire s\'engage à :',
        '• Exécuter la prestation conformément aux termes du présent contrat',
        '• Respecter les délais convenus',
        '• Informer le Client de tout obstacle à la bonne exécution',
        '• Garantir la qualité et la conformité des travaux livrés',
      ],
    });

    // ── ARTICLE 5 ──────────────────────────────────────────
    drawSection(doc, {
      titre: 'ARTICLE 5 – OBLIGATIONS DU CLIENT',
      contenu: [
        'Le Client s\'engage à :',
        '• Mettre à disposition les informations nécessaires',
        '• Régler les honoraires dans les délais convenus',
        '• Collaborer de bonne foi avec le Prestataire',
      ],
    });

    // ── ARTICLE 6 ──────────────────────────────────────────
    drawSection(doc, {
      titre: 'ARTICLE 6 – CONFIDENTIALITÉ',
      contenu: `Les parties s'engagent à garder confidentielles toutes informations échangées. Cette obligation s'applique pendant la durée du contrat et pendant 2 ans après son terme.`,
    });

    // ── ARTICLE 7 ──────────────────────────────────────────
    drawSection(doc, {
      titre: 'ARTICLE 7 – RÉSILIATION',
      contenu: `Chaque partie peut résilier en cas de manquement grave, après mise en demeure restée sans effet pendant 15 jours.`,
    });

    // ── ARTICLE 8 ──────────────────────────────────────────
    drawSection(doc, {
      titre: 'ARTICLE 8 – LITIGES',
      contenu: `Les parties s'engagent à rechercher une solution amiable. À défaut, le litige sera soumis aux tribunaux compétents du Sénégal.`,
    });

    // ── SIGNATURES ─────────────────────────────────────────
    drawSignatures(doc, {
      partie1: 'Le Prestataire',
      partie2: 'Le Client',
      dateSignature: today(),
      signatureBuffer1,
      signatureBuffer2,
    });

    doc.end();
  });
};
