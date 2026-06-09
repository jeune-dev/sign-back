const PDFDocument = require('pdfkit');
const { attachFooter } = require('../../../utils/pdfFooter');

module.exports = async function fichePaieTemplate({ fiche }) {

  const val = v => (v !== undefined && v !== null && v !== '' ? v : '—');

  // Formatage manuel sans toLocaleString (evite les "/" et espaces incorrects de PDFKit)
  const fmt = v => {
    const raw = val(v);
    if (raw === '—') return '—';
    const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
    if (isNaN(n)) return raw;
    const parts = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts + ' FCFA';
  };

  return new Promise((resolve, reject) => {

    const doc = new PDFDocument({ size: 'A4', margin: 0 });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
    attachFooter(doc);

    // ─────────────────────────────────────────
    // CONSTANTES DE MISE EN PAGE
    // ─────────────────────────────────────────
    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const MARGIN = 30;
    const INNER_W = PAGE_W - MARGIN * 2;

    const BLACK = '#0D0D0D';
    const DARK_GRAY = '#2C2C2C';
    const MID_GRAY = '#5A5A5A';
    const LIGHT_GRAY = '#D6D6D6';
    const NEAR_WHITE = '#F5F5F5';

    // ─────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────

    function sectionHeader(y, title) {
      doc.rect(MARGIN, y, INNER_W, 18).fill(DARK_GRAY);
      doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold')
        .text(title.toUpperCase(), MARGIN + 8, y + 5, { width: INNER_W - 16, lineBreak: false });
      return y + 18;
    }

    function infoGrid(yStart, rows) {
      const ROW_H = 16;
      const HALF = INNER_W / 2;
      const LBL_W = 92;
      const VAL_W = HALF - LBL_W - 14;

      rows.forEach((row, i) => {
        const y = yStart + i * ROW_H;
        const bg = i % 2 === 0 ? '#FFFFFF' : NEAR_WHITE;
        doc.rect(MARGIN, y, INNER_W, ROW_H).fill(bg);

        doc.fillColor(MID_GRAY).fontSize(7).font('Helvetica')
          .text(row[0] || '', MARGIN + 5, y + 4, { width: LBL_W, lineBreak: false, ellipsis: true });
        doc.fillColor(BLACK).fontSize(7.5).font('Helvetica-Bold')
          .text(row[1] || '', MARGIN + LBL_W + 8, y + 4, { width: VAL_W, lineBreak: false, ellipsis: true });

        doc.moveTo(MARGIN + HALF, y + 2)
          .lineTo(MARGIN + HALF, y + ROW_H - 2)
          .strokeColor(LIGHT_GRAY).lineWidth(0.4).stroke();

        doc.fillColor(MID_GRAY).fontSize(7).font('Helvetica')
          .text(row[2] || '', MARGIN + HALF + 5, y + 4, { width: LBL_W, lineBreak: false, ellipsis: true });
        doc.fillColor(BLACK).fontSize(7.5).font('Helvetica-Bold')
          .text(row[3] || '', MARGIN + HALF + LBL_W + 8, y + 4, { width: VAL_W, lineBreak: false, ellipsis: true });
      });

      doc.rect(MARGIN, yStart, INNER_W, rows.length * ROW_H)
        .strokeColor(LIGHT_GRAY).lineWidth(0.4).stroke();

      return yStart + rows.length * ROW_H;
    }

    // ─────────────────────────────────────────
    // BANDEAU TITRE
    // ─────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, 55).fill(BLACK);

    // Logo entreprise (si présent) — affiché en haut à droite du bandeau
    if (fiche.logo && fiche.logo.trim()) {
      try {
        const raw = fiche.logo.replace(/^data:image\/[a-z+]+;base64,/i, '');
        const logoBuf = Buffer.from(raw, 'base64');
        doc.image(logoBuf, PAGE_W - MARGIN - 50, 4, { fit: [46, 46] });
      } catch (_) {}
    }

    doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold')
      .text('BULLETIN DE PAIE', MARGIN, 12, { align: 'center', width: INNER_W });

    doc.fillColor(LIGHT_GRAY).fontSize(8.5).font('Helvetica')
      .text(
        `N° ${val(fiche.numero_fiche)}   |   Période : ${val(fiche.mois)} / ${val(fiche.annee)}`,
        MARGIN, 35, { align: 'center', width: INNER_W }
      );

    let y = 65;

    // ─────────────────────────────────────────
    // EMPLOYEUR
    // ─────────────────────────────────────────
    y = sectionHeader(y, 'Informations Employeur');
    y = infoGrid(y, [
      ['Entreprise', val(fiche.nom_entreprise), 'NINEA', val(fiche.ninea)],
      ['Représentant', val(fiche.representant), 'Téléphone', val(fiche.telephone_employeur)],
      ['Adresse', val(fiche.adresse_employeur), '', ''],
    ]);
    y += 6;

    // ─────────────────────────────────────────
    // SALARIÉ
    // ─────────────────────────────────────────
    y = sectionHeader(y, 'Informations Salarié');
    y = infoGrid(y, [
      ['Nom & Prénom', `${val(fiche.prenom_salarie)} ${val(fiche.nom_salarie)}`,
        'Poste', val(fiche.poste)],
      ['N° CNI', val(fiche.numero_cni), "Date d'embauche", val(fiche.date_embauche)],
      ['Email', val(fiche.email_salarie), 'N° IPRES', val(fiche.numero_ipres)],
      ['Type de contrat', val(fiche.type_contrat), 'N° CSS', val(fiche.numero_css)],
    ]);
    y += 6;

    // ─────────────────────────────────────────
    // TEMPS DE TRAVAIL
    // ─────────────────────────────────────────
    y = sectionHeader(y, 'Temps de Travail');

    const absenceRows = fiche.absence
      ? [
        ['Jours travaillés', String(val(fiche.nombre_jours_travailles)), 'Absence', 'Oui'],
        ['Heures travaillées', String(val(fiche.nombre_heures_travailles)), "Type d'absence", val(fiche.type_absence)],
        ['H. supplémentaires', String(val(fiche.nombre_heures_supplementaires)), 'Jours absence', String(val(fiche.nombre_jours_absence))],
      ]
      : [
        ['Jours travaillés', String(val(fiche.nombre_jours_travailles)), 'Absence', 'Non'],
        ['Heures travaillées', String(val(fiche.nombre_heures_travailles)), 'H. supplémentaires', String(val(fiche.nombre_heures_supplementaires))],
      ];

    y = infoGrid(y, absenceRows);
    y += 8;

    // ─────────────────────────────────────────
    // TABLEAU FINANCIER
    // ─────────────────────────────────────────
    y = sectionHeader(y, 'Détail des Gains et Retenues');
    y += 1;

    // Colonnes : 36% libellé | 14% montant | 36% libellé | 14% montant
    const W_LBL = Math.floor(INNER_W * 0.36);
    const W_AMT = Math.floor(INNER_W * 0.14);
    const W_LBL2 = Math.floor(INNER_W * 0.36);
    const W_AMT2 = INNER_W - W_LBL - W_AMT - W_LBL2;

    const X1 = MARGIN;                    // début libellé gains
    const X2 = X1 + W_LBL;               // début montant gains
    const X3 = X2 + W_AMT;               // début libellé retenues
    const X4 = X3 + W_LBL2;              // début montant retenues

    const ROW_H = 15;

    // ── En-têtes ──
    doc.rect(X1, y, INNER_W, ROW_H).fill(BLACK);
    doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
    doc.text('GAINS', X1 + 5, y + 4, { width: W_LBL - 8, lineBreak: false });
    doc.text('Montant', X2 + 3, y + 4, { width: W_AMT - 5, align: 'right', lineBreak: false });
    doc.moveTo(X3, y).lineTo(X3, y + ROW_H).strokeColor('#666').lineWidth(0.5).stroke();
    doc.text('RETENUES', X3 + 5, y + 4, { width: W_LBL2 - 8, lineBreak: false });
    doc.text('Montant', X4 + 3, y + 4, { width: W_AMT2 - 5, align: 'right', lineBreak: false });
    y += ROW_H;

    // ── Données ──
    const gains = [
      ['Salaire de base', fmt(fiche.salaire_base)],
      ['Prime de transport', fmt(fiche.prime_transport)],
      ['Prime de logement', fmt(fiche.prime_logement)],
      ['Prime de performance', fmt(fiche.prime_performance)],
      ['Prime exceptionnelle', fmt(fiche.prime_exceptionnelle)],
      ['Autres primes', fmt(fiche.autres_primes)],
      ['Heures supplémentaires', fmt(fiche.montant_heures_supp)],
    ];

    const retenues = [
      ['IPRES', fmt(fiche.montant_ipres)],
      ['CSS', fmt(fiche.montant_css)],
      ["Impôt sur le revenu", fmt(fiche.montant_ir)],
      ['Avance sur salaire', fmt(fiche.montant_avance_salaire)],
      ['Assurance', fmt(fiche.montant_assurance)],
      ['Autres retenues', fmt(fiche.montant_retenue)],
      ['', ''],
    ];

    const tableStartY = y;
    const maxRows = Math.max(gains.length, retenues.length);

    for (let i = 0; i < maxRows; i++) {
      const bg = i % 2 === 0 ? '#FFFFFF' : NEAR_WHITE;
      doc.rect(X1, y, INNER_W, ROW_H).fill(bg);

      const g = gains[i] || ['', ''];
      const r = retenues[i] || ['', ''];

      // Libellé gain
      doc.fillColor(BLACK).fontSize(7.5).font('Helvetica')
        .text(g[0], X1 + 5, y + 4, { width: W_LBL - 8, lineBreak: false, ellipsis: true });
      // Montant gain — aligné à droite dans sa colonne
      doc.font('Helvetica-Bold')
        .text(g[1], X2 + 3, y + 4, { width: W_AMT - 5, align: 'right', lineBreak: false });

      // Séparateur central
      doc.moveTo(X3, y).lineTo(X3, y + ROW_H)
        .strokeColor(LIGHT_GRAY).lineWidth(0.4).stroke();

      // Libellé retenue
      doc.fillColor(BLACK).fontSize(7.5).font('Helvetica')
        .text(r[0], X3 + 5, y + 4, { width: W_LBL2 - 8, lineBreak: false, ellipsis: true });
      // Montant retenue — aligné à droite dans sa colonne
      doc.font('Helvetica-Bold')
        .text(r[1], X4 + 3, y + 4, { width: W_AMT2 - 5, align: 'right', lineBreak: false });

      y += ROW_H;
    }

    // Bordure externe + séparateur central continu
    doc.rect(X1, tableStartY, INNER_W, maxRows * ROW_H)
      .strokeColor(LIGHT_GRAY).lineWidth(0.4).stroke();
    doc.moveTo(X3, tableStartY).lineTo(X3, y)
      .strokeColor(LIGHT_GRAY).lineWidth(0.4).stroke();

    // ── Ligne Totaux ──
    doc.rect(X1, y, INNER_W, ROW_H).fill(LIGHT_GRAY);
    doc.fillColor(BLACK).fontSize(8).font('Helvetica-Bold');
    doc.text('TOTAL GAINS', X1 + 5, y + 4, { width: W_LBL - 8, lineBreak: false });
    doc.text(fmt(fiche.total_gains),
      X2 + 3, y + 4, { width: W_AMT - 5, align: 'right', lineBreak: false });
    doc.moveTo(X3, y).lineTo(X3, y + ROW_H)
      .strokeColor(MID_GRAY).lineWidth(0.4).stroke();
    doc.text('TOTAL RETENUES', X3 + 5, y + 4, { width: W_LBL2 - 8, lineBreak: false });
    doc.text(fmt(fiche.total_retenues),
      X4 + 3, y + 4, { width: W_AMT2 - 5, align: 'right', lineBreak: false });
    y += ROW_H + 4;

    // ── Bandeau Salaire Net ──
    const NET_H = 28;
    doc.rect(MARGIN, y, INNER_W, NET_H).fill(BLACK);
    doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold')
      .text('SALAIRE NET À PAYER', MARGIN + 12, y + 9,
        { width: INNER_W * 0.55, lineBreak: false });
    doc.fontSize(12)
      .text(fmt(fiche.salaire_net), MARGIN, y + 9,
        { width: INNER_W - 12, align: 'right', lineBreak: false });
    y += NET_H + 16;

    // ─────────────────────────────────────────
    // SIGNATURES
    // ─────────────────────────────────────────
    doc.moveTo(MARGIN, y).lineTo(MARGIN + INNER_W, y)
      .strokeColor(LIGHT_GRAY).lineWidth(0.5).stroke();
    y += 10;

    doc.fillColor(MID_GRAY).fontSize(7).font('Helvetica')
      .text("Signature de l'Employeur", MARGIN, y, { width: INNER_W / 2 - 10, lineBreak: false })
      .text("Signature du Salarié", MARGIN + INNER_W / 2, y, { width: INNER_W / 2 - 10, lineBreak: false });

    y += 14;
    doc.fillColor(BLACK).font('Helvetica')
      .text('_'.repeat(36), MARGIN, y, { lineBreak: false })
      .text('_'.repeat(36), MARGIN + INNER_W / 2, y, { lineBreak: false });

    // ─────────────────────────────────────────
    // PIED DE PAGE
    // ─────────────────────────────────────────
    const FOOTER_Y = PAGE_H - 22;
    doc.moveTo(MARGIN, FOOTER_Y).lineTo(MARGIN + INNER_W, FOOTER_Y)
      .strokeColor(LIGHT_GRAY).lineWidth(0.3).stroke();

    doc.fillColor(MID_GRAY).fontSize(6.5).font('Helvetica')
      .text(
        'Ce bulletin de paie est établi conformément à la législation sénégalaise du travail. À conserver sans limitation de durée.',
        MARGIN, FOOTER_Y + 5, { width: INNER_W, align: 'center' }
      );

    doc.end();
  });
};