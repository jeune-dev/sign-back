const PDFDocument = require('pdfkit');

module.exports = async function contratConfidentialiteTemplate({ numero_contrat, generateur, autrePartie, contrat }) {
  const val = v => v ?? '—';
  const today = new Date().toLocaleDateString('fr-FR');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text('ACCORD DE CONFIDENTIALITÉ (NDA)', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`N° ${numero_contrat}  |  Niveau : ${val(contrat.niveau_confidentialite).toUpperCase()}  |  Date : ${today}`, { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(11).font('Helvetica-Bold').text('ENTRE LES SOUSSIGNÉS :');
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').text('PARTIE DIVULGATRICE (Partie 1) :');
    doc.font('Helvetica').text(`${val(generateur.nom)} ${val(generateur.prenom)}  |  Email : ${val(generateur.email)}`);
    if (generateur.nomEntreprise) doc.text(`Entreprise : ${val(generateur.nomEntreprise)}  |  RCCM : ${val(generateur.rc)}`);
    doc.text(`Ci-après dénommée « la Partie Divulgatrice »`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('PARTIE RÉCEPTRICE (Partie 2) :');
    doc.font('Helvetica').text(`${val(autrePartie.nom)} ${val(autrePartie.prenom)}  |  Email : ${val(autrePartie.email)}`);
    if (autrePartie.nomEntreprise) doc.text(`Entreprise : ${val(autrePartie.nomEntreprise)}  |  RCCM : ${val(autrePartie.rc)}`);
    doc.text(`Ci-après dénommée « la Partie Réceptrice »`);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('ARTICLE 1 – INFORMATIONS CONFIDENTIELLES');
    doc.font('Helvetica').text(`Type d'informations couvertes :`);
    doc.text(val(contrat.type_informations), { indent: 20 });
    doc.text(`Niveau de confidentialité : ${val(contrat.niveau_confidentialite).toUpperCase()}`);
    if (contrat.documents_concernes) doc.text(`Documents concernés : ${val(contrat.documents_concernes)}`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 2 – OBLIGATION DE NON-DIVULGATION');
    doc.font('Helvetica').text(`La Partie Réceptrice s'engage à ne pas divulguer, révéler, transmettre ou utiliser les Informations Confidentielles à des fins autres que celles définies dans le présent accord.`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 3 – USAGE LIMITÉ');
    doc.font('Helvetica').text(`Les Informations Confidentielles ne peuvent être utilisées que dans le cadre strict de la relation entre les parties.`);
    if (contrat.personnes_autorisees) {
      doc.text(`Personnes autorisées à accéder aux informations : ${val(contrat.personnes_autorisees)}`);
    }
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 4 – DURÉE');
    doc.font('Helvetica').text(`La présente obligation de confidentialité est valable pour : ${val(contrat.duree_confidentialite)}`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 5 – RESTITUTION');
    doc.font('Helvetica').text(`À la demande de la Partie Divulgatrice, la Partie Réceptrice devra restituer ou détruire tous les documents, supports ou copies contenant des Informations Confidentielles.`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 6 – SANCTIONS EN CAS DE VIOLATION');
    doc.font('Helvetica').text(val(contrat.sanctions_violation));
    doc.moveDown(1.5);

    doc.font('Helvetica').text(`Fait à ${val(contrat.ville_signature)}, le ${today}`);
    doc.moveDown(2);
    doc.text('Partie Divulgatrice                       Partie Réceptrice');
    doc.moveDown(3);
    doc.text('Signature :                               Signature :');

    doc.end();
  });
};
