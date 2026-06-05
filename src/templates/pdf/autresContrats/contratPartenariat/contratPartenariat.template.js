const PDFDocument = require('pdfkit');

module.exports = async function contratPartenariatTemplate({ numero_contrat, generateur, autrePartie, contrat }) {
  const val = v => v ?? '—';
  const today = new Date().toLocaleDateString('fr-FR');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text('CONTRAT DE PARTENARIAT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`N° ${numero_contrat}  |  Date : ${today}`, { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(11).font('Helvetica-Bold').text('ENTRE LES SOUSSIGNÉS :');
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').text('PARTENAIRE 1 :');
    doc.font('Helvetica').text(`${val(generateur.nom)} ${val(generateur.prenom)}  |  Email : ${val(generateur.email)}`);
    if (generateur.nomEntreprise) doc.text(`Entreprise : ${val(generateur.nomEntreprise)}  |  RCCM : ${val(generateur.rc)}`);
    doc.text(`Ci-après dénommé « Partenaire 1 »`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('PARTENAIRE 2 :');
    doc.font('Helvetica').text(`${val(autrePartie.nom)} ${val(autrePartie.prenom)}  |  Email : ${val(autrePartie.email)}`);
    if (autrePartie.nomEntreprise) doc.text(`Entreprise : ${val(autrePartie.nomEntreprise)}  |  RCCM : ${val(autrePartie.rc)}`);
    doc.text(`Ci-après dénommé « Partenaire 2 »`);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('ARTICLE 1 – OBJET DU PARTENARIAT');
    doc.font('Helvetica').text(val(contrat.objet_partenariat));
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 2 – DURÉE');
    doc.font('Helvetica').text(val(contrat.duree));
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 3 – RESPONSABILITÉS');
    doc.font('Helvetica').text(`Partenaire 1 : ${val(contrat.responsabilites_partie1)}`);
    doc.text(`Partenaire 2 : ${val(contrat.responsabilites_partie2)}`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 4 – CONTRIBUTIONS');
    doc.font('Helvetica').text(`Partenaire 1 : ${val(contrat.contribution_partie1)}`);
    doc.text(`Partenaire 2 : ${val(contrat.contribution_partie2)}`);
    doc.moveDown(0.8);

    if (contrat.partage_revenus) {
      doc.font('Helvetica-Bold').text('ARTICLE 5 – PARTAGE DES REVENUS');
      doc.font('Helvetica').text(`Partenaire 1 : ${val(contrat.pourcentage_partie1)}%`);
      doc.text(`Partenaire 2 : ${val(contrat.pourcentage_partie2)}%`);
      doc.moveDown(0.8);
    }

    doc.font('Helvetica-Bold').text('ARTICLE 6 – CONFIDENTIALITÉ');
    doc.font('Helvetica').text(`Les parties s'engagent à maintenir strictement confidentielle toute information relative au partenariat.`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 7 – NON-CONCURRENCE');
    doc.font('Helvetica').text(`Les parties s'interdisent, pendant la durée du partenariat, d'exercer toute activité concurrente à l'objet du présent accord.`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 8 – RÉSILIATION');
    doc.font('Helvetica').text(`Chaque partie peut résilier le présent accord moyennant un préavis de 30 jours en cas de manquement grave de l'autre partie.`);
    doc.moveDown(1.5);

    doc.font('Helvetica').text(`Fait à ${val(contrat.ville_signature)}, le ${today}`);
    doc.moveDown(2);
    doc.text('Partenaire 1                              Partenaire 2');
    doc.moveDown(3);
    doc.text('Signature :                               Signature :');

    doc.end();
  });
};
