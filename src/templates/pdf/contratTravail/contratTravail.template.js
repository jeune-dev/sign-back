const PDFDocument = require('pdfkit');
const https = require('https');
const http  = require('http');
const { attachFooter } = require('../../../utils/pdfFooter');
const logger = require('../../../utils/logger');

async function fetchImageBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = async function contratTravailTemplate(data) {

  const {
    numero_contrat,
    employeur,
    salarie,
    contrat
  } = data;

  const val = v => v ?? '-';
  const fmtMoyen = v => v === 'ALL' ? 'Tout mode de paiement' : val(v);
  const today = new Date().toLocaleDateString('fr-FR');

  // Résoudre les signatures AVANT d'entrer dans la Promise (évite await dans callback non-async)
  let empSigBuffer = null;
  let salSigBuffer = null;
  if (employeur.signature) {
    try {
      if (employeur.signature.startsWith('http')) {
        empSigBuffer = await fetchImageBuffer(employeur.signature);
      } else {
        const b64 = employeur.signature.replace(/^data:image\/\w+;base64,/, '');
        empSigBuffer = Buffer.from(b64, 'base64');
      }
    } catch (e) {
      logger.error('[contratTravail] Erreur chargement signature employeur:', e.message);
    }
  }
  if (salarie.signature) {
    try {
      if (salarie.signature.startsWith('http')) {
        salSigBuffer = await fetchImageBuffer(salarie.signature);
      } else {
        const b64 = salarie.signature.replace(/^data:image\/\w+;base64,/, '');
        salSigBuffer = Buffer.from(b64, 'base64');
      }
    } catch (e) {
      logger.error('[contratTravail] Erreur chargement signature salarié:', e.message);
    }
  }

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

    // Logo employeur (si présent)
    if (employeur.logo && employeur.logo.trim()) {
      try {
        const raw = employeur.logo.replace(/^data:image\/[a-z+]+;base64,/i, '');
        const logoBuf = Buffer.from(raw, 'base64');
        doc.image(logoBuf, 40, doc.y, { fit: [60, 60] });
        doc.moveDown(0.5);
      } catch (_) {}
    }

    doc.fontSize(18).text('CONTRAT DE TRAVAIL (CDI)', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).text(`N° Contrat : ${numero_contrat}`);
    doc.text(`Date : ${today}`);
    doc.moveDown();

    // =========================
    // PARTIES
    // =========================
    doc.fontSize(11).text('Entre les soussignés :');
    doc.moveDown();

    doc.text("L'Employeur :");
    doc.text(`${val(employeur.nom)} ${val(employeur.prenom)}, sis à ${val(employeur.adresse)}, téléphone ${val(employeur.telephone)}, email ${val(employeur.email)}.`);
    doc.text(`Immatriculée sous le NINEA ${val(employeur.ninea)} et le RCCM ${val(employeur.rc)}.`);
    doc.text(`Ci-après dénommé « l'Employeur »`);
    doc.moveDown();

    doc.text('ET');
    doc.moveDown();

    doc.text('Le Salarié :');
    doc.text(`M./Mme ${val(salarie.nom)} ${val(salarie.prenom)}, titulaire de la CNI n° ${val(salarie.cni)}, domicilié(e) à ${val(salarie.adresse)}, téléphone ${val(salarie.telephone)}.`);
    doc.text(`Ci-après dénommé « le Salarié »`);
    doc.moveDown();

    // =========================
    // ARTICLE 1
    // =========================
    doc.text('ARTICLE 1 - OBJET DU CONTRAT');
    doc.text(`Le présent contrat de travail est conclu conformément aux dispositions du Code du travail en vigueur au Sénégal. Il a pour objet de définir les conditions dans lesquelles le Salarié est recruté par l'Employeur ainsi que les droits, obligations et responsabilités des deux parties dans le cadre de leur relation professionnelle.`);
    doc.moveDown();

    // =========================
    // ARTICLE 2
    // =========================
    doc.text('ARTICLE 2 - NATURE DU CONTRAT');
    doc.text(`Le présent contrat est un contrat à durée indéterminée (CDI) prenant effet à compter du ${val(contrat.date_debut)}. Il est conclu sans limitation de durée.`);
    doc.moveDown();

    // =========================
    // ARTICLE 3
    // =========================
    doc.text('ARTICLE 3 - FONCTION ET MISSIONS');
    doc.text(`Le Salarié est engagé en qualité de : ${val(contrat.poste)}.`);
    doc.text(`Dans le cadre de ses fonctions, il sera chargé notamment des missions suivantes :`);

    (contrat.missions || []).forEach(m => {
      doc.text(`- ${m}`);
    });

    doc.text(`Le Salarié s'engage à exécuter ses fonctions avec professionnalisme.`);
    doc.moveDown();

    // =========================
    // ARTICLE 4
    // =========================
    doc.text('ARTICLE 4 - LIEU DE TRAVAIL');
    doc.text(`Le lieu principal est fixé à : ${val(contrat.lieu_travail)}.`);
    doc.moveDown();

    // =========================
    // ARTICLE 5
    // =========================
    doc.text('ARTICLE 5 - TEMPS DE TRAVAIL');
    // Planning par jour (nouveau format JSON)
    const planning = Array.isArray(contrat.jour_travail) ? contrat.jour_travail : [];
    if (planning.length > 0) {
      planning.forEach(j => {
        doc.text(`  • ${val(j.jour)} : ${val(j.debut)} – ${val(j.fin)}`);
      });
    } else {
      doc.text(`Jours : ${val(contrat.jour_travail)}`);
      doc.text(`Horaires : ${val(contrat.heure_debut)} à ${val(contrat.heure_fin)}`);
    }
    doc.text(`Pause : ${val(contrat.temps_pause)}`);
    doc.moveDown();

    // =========================
    // ARTICLE 6
    // =========================
    doc.text('ARTICLE 6 - RÉMUNÉRATION');
    doc.text(`Salaire : ${val(contrat.salaire_mensuel)} FCFA`);
    doc.text(`Mode de paiement : ${fmtMoyen(contrat.moyen_paiement)}`);
    doc.moveDown();

    // =========================
    // ARTICLE 7
    // =========================
    doc.text('ARTICLE 7 - CONGÉS ET JOURS FÉRIÉS');
    doc.text(`${val(contrat.nbr_jours_conges)} jours par an`);
    const mapFeries = {
    'rémunérés': 'rémérés',
    'non rémunérés': 'non rémunérés',
    'travail_effectif': 'rémunérés uniquement en cas de travail effectif'
    };

    doc.text(mapFeries[contrat.remuneration_jours_feries] || '-');
    doc.moveDown();

    // =========================
    // ARTICLE 8
    // =========================
    doc.text('ARTICLE 8 - ABSENCE POUR MALADIE');
    const mapAbsence = {
    'rémunérés': 'rémunérées',
    'non rémunérés': 'non rémunérées',
    'sous_conditions': 'rémunérées sous conditions (ancienneté, justification, validation médicale)'
    };

    doc.text(mapAbsence[contrat.remuneration_absences_maladie] || '-');
    doc.moveDown();

    // =========================
    // ARTICLE 9
    // =========================
    doc.text('ARTICLE 9 - RETARDS ET DISCIPLINE');
    doc.text(`Le Salarié doit respecter les horaires.`);
    doc.moveDown();

    // =========================
    // ARTICLE 10
    // =========================
    doc.text('ARTICLE 10 - AVANCES SUR SALAIRE');
    doc.text(contrat.avance_salaire ? 'autorisées' : 'non autorisées');
    doc.moveDown();

    // =========================
    // ARTICLE 11
    // =========================
    doc.text('ARTICLE 11 - AVANTAGES EN NATURE');

    const avantages = contrat.avantages_salarial || [];
    doc.text(avantages.includes('logement') ? '☑ logement' : '☐ logement');
    doc.text(avantages.includes('nourriture') ? '☑ nourriture' : '☐ nourriture');
    doc.text(avantages.includes('transport') ? '☑ transport' : '☐ transport');

    doc.moveDown();

    // =========================
    // ARTICLE 12
    // =========================
    doc.text('ARTICLE 12 - OBLIGATIONS DU SALARIÉ');
    doc.text(`Le Salarié s'engage à respecter les règles.`);
    doc.moveDown();

    // =========================
    // ARTICLE 13
    // =========================
    doc.text('ARTICLE 13 - CLAUSES PARTICULIÈRES');

    const clauses = contrat.clauses || [];
    doc.text(clauses.includes('confidentialite') ? '☑ clause de confidentialité' : '☐ clause de confidentialité');
    doc.text(clauses.includes('non_concurrence') ? '☑ clause de non-concurrence' : '☐ clause de non-concurrence');
    doc.text(clauses.includes('exclusivite') ? "☑ clause d'exclusivité" : "☐ clause d'exclusivité");

    doc.moveDown();

    // =========================
    // ARTICLE 14
    // =========================
    doc.text('ARTICLE 14 - RUPTURE DU CONTRAT');
    doc.text(`Préavis : ${val(contrat.duree_preavis)}`);
    doc.moveDown();

    // =========================
    // ARTICLE 15
    // =========================
    doc.text('ARTICLE 15 - DISPOSITIONS GÉNÉRALES');
    doc.text(`Régi par le Code du travail sénégalais.`);
    doc.moveDown();

    // =========================
    // ARTICLE 16
    // =========================
    doc.text('ARTICLE 16 - ASSURANCE');

    const assurance = contrat.assurance_maladie || {};

    doc.text(assurance.type === 'aucune' ? '☑ aucune assurance' : '☐ aucune assurance');
    doc.text(assurance.type === 'basique' ? '☑ assurance basique' : '☐ assurance basique');
    doc.text(assurance.type === 'intermediaire' ? '☑ assurance intermédiaire' : '☐ assurance intermédiaire');
    doc.text(assurance.type === 'complete' ? '☑ assurance complète' : '☐ assurance complète');

    doc.moveDown();

    // =========================
    // SIGNATURE
    // =========================
    doc.moveDown();

    // "Fait à" : utilise lieu_travail si lieu_signature absent
    const lieuSign = contrat.lieu_signature || contrat.lieu_travail || '___________';
    const dateSign = contrat.date_signature
      ? new Date(contrat.date_signature).toLocaleDateString('fr-FR')
      : today;
    doc.fontSize(10).text(`Fait à ${lieuSign}, le ${dateSign}`, { align: 'center' });
    doc.moveDown(2);

    // ── Colonnes signatures ───────────────────────────────────
    const PAGE_W   = 595.28;
    const MARGIN   = 40;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    const colW = CONTENT_W / 2 - 6;
    const BLACK = '#000000';
    const WHITE = '#FFFFFF';
    const DARK_GRAY = '#555555';

    let y = doc.y;

    // En-têtes colonnes
    doc.rect(MARGIN, y, colW, 22).fill(BLACK);
    doc.rect(MARGIN + colW + 12, y, colW, 22).fill(BLACK);
    doc.fontSize(10).fillColor(WHITE).font('Helvetica-Bold')
       .text("L'Employeur", MARGIN, y + 7, { width: colW, align: 'center' })
       .text('Le Salarié',  MARGIN + colW + 12, y + 7, { width: colW, align: 'center' });
    y += 22;

    // Noms
    const empNom = employeur.nomEntreprise
      ? `${employeur.nomEntreprise} - ${employeur.prenom} ${employeur.nom}`
      : `${employeur.prenom} ${employeur.nom}`;
    const salNom = `${salarie.prenom} ${salarie.nom}`;

    doc.rect(MARGIN, y, colW, 20).lineWidth(0.5).strokeColor(BLACK).stroke();
    doc.rect(MARGIN + colW + 12, y, colW, 20).lineWidth(0.5).strokeColor(BLACK).stroke();
    doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold')
       .text(empNom, MARGIN + 6, y + 6, { width: colW - 12 })
       .text(salNom, MARGIN + colW + 18, y + 6, { width: colW - 12 });
    y += 20;

    // Zone signature employeur
    const SIG_H = 90;
    doc.rect(MARGIN, y, colW, SIG_H).lineWidth(0.5).strokeColor(BLACK).stroke();
    if (empSigBuffer) {
      try {
        doc.image(empSigBuffer, MARGIN + 8, y + 6, {
          fit: [colW - 24, SIG_H - 20], align: 'center', valign: 'center',
        });
      } catch (e) {
        logger.error('[contratTravail] Erreur affichage signature employeur:', e.message);
      }
    }

    // Zone signature salarié
    doc.rect(MARGIN + colW + 12, y, colW, SIG_H).lineWidth(0.5).strokeColor(BLACK).stroke();
    if (salSigBuffer) {
      try {
        doc.image(salSigBuffer, MARGIN + colW + 20, y + 6, {
          fit: [colW - 24, SIG_H - 20], align: 'center', valign: 'center',
        });
      } catch (e) {
        logger.error('[contratTravail] Erreur affichage signature salarié:', e.message);
      }
    }

    // Labels bas de zone
    doc.fontSize(7.5).fillColor(DARK_GRAY).font('Helvetica')
       .text('Signature & cachet :', MARGIN + 6, y + SIG_H - 14, { width: colW - 12 })
       .text('Signature :', MARGIN + colW + 18, y + SIG_H - 14, { width: colW - 12 });

    doc.end();
  });
};