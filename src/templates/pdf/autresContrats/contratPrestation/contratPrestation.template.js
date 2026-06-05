const PDFDocument = require('pdfkit');

module.exports = async function contratPrestationTemplate({ numero_contrat, generateur, autrePartie, contrat }) {
  const val = v => v ?? '—';
  const today = new Date().toLocaleDateString('fr-FR');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // ── EN-TÊTE ────────────────────────────────────────────────
    doc.fontSize(18).font('Helvetica-Bold').text('CONTRAT DE PRESTATION DE SERVICES', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`N° ${numero_contrat}  |  Date : ${today}`, { align: 'center' });
    doc.moveDown(1.5);

    // ── PARTIES ───────────────────────────────────────────────
    doc.fontSize(11).font('Helvetica-Bold').text('ENTRE LES SOUSSIGNÉS :');
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').text('LE PRESTATAIRE (Partie 1) :');
    doc.font('Helvetica').text(`${val(generateur.nom)} ${val(generateur.prenom)}`);
    doc.text(`Email : ${val(generateur.email)}  |  Tél : ${val(generateur.telephone)}`);
    if (generateur.nomEntreprise) {
      doc.text(`Entreprise : ${val(generateur.nomEntreprise)}  |  RCCM : ${val(generateur.rc)}  |  NINEA : ${val(generateur.ninea)}`);
    }
    doc.text(`Ci-après dénommé « le Prestataire »`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('LE CLIENT (Partie 2) :');
    doc.font('Helvetica').text(`${val(autrePartie.nom)} ${val(autrePartie.prenom)}`);
    doc.text(`Email : ${val(autrePartie.email)}  |  Tél : ${val(autrePartie.telephone)}`);
    if (autrePartie.nomEntreprise) {
      doc.text(`Entreprise : ${val(autrePartie.nomEntreprise)}  |  RCCM : ${val(autrePartie.rc)}`);
    }
    doc.text(`Ci-après dénommé « le Client »`);
    doc.moveDown(1);

    // ── ARTICLE 1 – OBJET ──────────────────────────────────────
    doc.font('Helvetica-Bold').text('ARTICLE 1 – OBJET DE LA PRESTATION');
    doc.font('Helvetica').text(`Le présent contrat a pour objet : ${val(contrat.objet_prestation)}.`);
    doc.text(`Type de prestation : ${val(contrat.type_prestation)}`);
    doc.text(`Description de la mission :`);
    doc.text(val(contrat.description_mission), { indent: 20 });
    doc.moveDown(0.8);

    // ── ARTICLE 2 – DURÉE ─────────────────────────────────────
    doc.font('Helvetica-Bold').text('ARTICLE 2 – DURÉE DE LA MISSION');
    doc.font('Helvetica').text(`Durée : ${val(contrat.duree_mission)}`);
    doc.text(`Date de début : ${val(contrat.date_debut)}`);
    doc.text(`Date de fin : ${val(contrat.date_fin)}`);
    doc.moveDown(0.8);

    // ── ARTICLE 3 – RÉMUNÉRATION ──────────────────────────────
    doc.font('Helvetica-Bold').text('ARTICLE 3 – RÉMUNÉRATION ET MODE DE PAIEMENT');
    doc.font('Helvetica').text(`Montant total : ${val(contrat.montant_total)} FCFA`);
    doc.text(`Mode de paiement : ${val(contrat.mode_paiement)}`);
    doc.moveDown(0.8);

    // ── ARTICLE 4 – OBLIGATIONS DU PRESTATAIRE ───────────────
    doc.font('Helvetica-Bold').text('ARTICLE 4 – OBLIGATIONS DU PRESTATAIRE');
    doc.font('Helvetica').text(`Le Prestataire s'engage à :`);
    doc.text('- Exécuter la prestation conformément aux termes du présent contrat', { indent: 20 });
    doc.text('- Respecter les délais convenus', { indent: 20 });
    doc.text('- Informer le Client de tout obstacle à la bonne exécution de la mission', { indent: 20 });
    doc.text('- Garantir la qualité et la conformité des travaux livrés', { indent: 20 });
    doc.moveDown(0.8);

    // ── ARTICLE 5 – OBLIGATIONS DU CLIENT ────────────────────
    doc.font('Helvetica-Bold').text('ARTICLE 5 – OBLIGATIONS DU CLIENT');
    doc.font('Helvetica').text(`Le Client s'engage à :`);
    doc.text('- Mettre à disposition les informations nécessaires à l\'exécution de la mission', { indent: 20 });
    doc.text('- Régler les honoraires dans les délais convenus', { indent: 20 });
    doc.text('- Collaborer de bonne foi avec le Prestataire', { indent: 20 });
    doc.moveDown(0.8);

    // ── ARTICLE 6 – CONFIDENTIALITÉ ──────────────────────────
    doc.font('Helvetica-Bold').text('ARTICLE 6 – CONFIDENTIALITÉ');
    doc.font('Helvetica').text(`Les parties s'engagent à garder confidentielles toutes informations échangées dans le cadre de la présente prestation. Cette obligation de confidentialité s'applique pendant toute la durée du contrat et pendant une période de 2 ans après son terme.`);
    doc.moveDown(0.8);

    // ── ARTICLE 7 – RÉSILIATION ───────────────────────────────
    doc.font('Helvetica-Bold').text('ARTICLE 7 – RÉSILIATION');
    doc.font('Helvetica').text(`Chaque partie peut résilier le présent contrat en cas de manquement grave de l'autre partie à ses obligations, après mise en demeure restée sans effet pendant 15 jours.`);
    doc.moveDown(0.8);

    // ── ARTICLE 8 – LITIGES ───────────────────────────────────
    doc.font('Helvetica-Bold').text('ARTICLE 8 – LITIGES');
    doc.font('Helvetica').text(`En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut d'accord, le litige sera soumis aux tribunaux compétents du Sénégal.`);
    doc.moveDown(1.5);

    // ── SIGNATURES ────────────────────────────────────────────
    doc.font('Helvetica').text(`Fait à ${val(contrat.ville_signature)}, le ${val(contrat.date_contrat)}`);
    doc.moveDown(2);
    doc.text('Le Prestataire                                Le Client');
    doc.moveDown(0.5);
    doc.text('Signature :                                   Signature :');
    doc.moveDown(3);
    if (contrat.signature_generateur) {
      doc.text('[Signé électroniquement par le Prestataire]                    [En attente de signature du Client]');
    }

    doc.end();
  });
};
