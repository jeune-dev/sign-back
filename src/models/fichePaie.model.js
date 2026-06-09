const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FichePaie = sequelize.define('FichePaie', {

  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  numero_fiche: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  // ══════════════════════════════════════════════════════════════
  // FK — EMPLOYEUR (utilisateur connecté qui crée la fiche)
  // ══════════════════════════════════════════════════════════════
  employeurId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'utilisateur',
      key: 'id'
    }
  },

  salarieId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'utilisateur',
      key: 'id'
    }
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION 2 — IDENTIFICATION SALARIÉ
  // ══════════════════════════════════════════════════════════════

  numero_ipres: {
    type: DataTypes.STRING,
    allowNull: true
  },

  numero_css: {
    type: DataTypes.STRING,
    allowNull: true
  },

  poste: {
    type: DataTypes.STRING,
    allowNull: true
  },

  date_embauche: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION 3 — TYPE DE CONTRAT
  // ══════════════════════════════════════════════════════════════
  type_contrat: {
    type: DataTypes.ENUM('CDI', 'CDD', 'Intérim', 'Domestique'),
    allowNull: false
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION 4 — PÉRIODE DE PAIE
  // ══════════════════════════════════════════════════════════════
  mois: {
    type: DataTypes.ENUM(
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ),
    allowNull: false
  },

  annee: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION 5 — SALAIRE DE BASE
  // ══════════════════════════════════════════════════════════════
  salaire_brut: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },

  mode_calcul: {
    type: DataTypes.ENUM('Mensuel', 'Journalier', 'Horaire'),
    allowNull: false,
    defaultValue: 'Mensuel'
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION 6 — TEMPS DE TRAVAIL EFFECTIF
  // ══════════════════════════════════════════════════════════════
  nombre_jours_travailles: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  nombre_heures_travailles: {
    type: DataTypes.FLOAT,
    allowNull: true
  },

  absence: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  nombre_jours_absence: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  type_absence: {
    type: DataTypes.ENUM('Maladie', 'Absence non justifiée', 'Congé', 'Autre'),
    allowNull: true
  },

  autre_type_absence: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION 7 — HEURES SUPPLÉMENTAIRES
  // ══════════════════════════════════════════════════════════════
  a_heures_supp: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  nombre_heures_supplementaires: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION 8 — PRIMES ET AVANTAGES
  // ══════════════════════════════════════════════════════════════
  a_primes: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  prime_transport: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  prime_logement: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  prime_performance: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  prime_exceptionnelle: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  autres_primes: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION 9 — AVANTAGES EN NATURE
  // ══════════════════════════════════════════════════════════════
  avantages_nature: {
    type: DataTypes.ENUM('Aucun', 'Logement', 'Nourriture', 'Transport', 'Autres'),
    allowNull: true
  },

  autre_avantages: {
    type: DataTypes.STRING,
    allowNull: true
  },

  valeur_avantages: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION 10 — CONGÉS PAYÉS
  // ══════════════════════════════════════════════════════════════
  conges_pris: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  nombre_jours_conges: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  montant_conges: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION 11 — AVANCES ET RETENUES
  // ══════════════════════════════════════════════════════════════
  a_avance_salaire: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  montant_avance_salaire: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  a_autres_retenues: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  motif_retenue: {
    type: DataTypes.STRING,
    allowNull: true
  },

  montant_retenue: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION 12 — COTISATIONS SOCIALES
  // ══════════════════════════════════════════════════════════════
  soumis_cotisation: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  soumis_ipres: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  soumis_css: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  a_assurance: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  montant_assurance: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION 13 — IMPÔTS ET TAXES
  // ══════════════════════════════════════════════════════════════
  soumis_ir: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  situation_familiale: {
    type: DataTypes.ENUM('Célibataire', 'Marié'),
    allowNull: false,
    defaultValue: 'Célibataire'
  },

  nombre_enfants: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION 14 — MODE DE PAIEMENT
  // ══════════════════════════════════════════════════════════════
  mode_paiement: {
    type: DataTypes.ENUM('Espèces', 'Virement bancaire', 'Wave / Orange Money', 'ALL'),
    allowNull: false
  },

  date_paiement: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  // ══════════════════════════════════════════════════════════════
  // RÉSULTATS CALCULS (générés automatiquement)
  // ══════════════════════════════════════════════════════════════
  total_gains: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },

  montant_ipres: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },

  montant_css: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },

  montant_ir: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },

  total_retenues: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },

  salaire_net: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },

  // ══════════════════════════════════════════════════════════════
  // PDF
  // ══════════════════════════════════════════════════════════════
  fiche_pdf: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'PDF encodé en base64'
  }

}, {
  tableName: 'FichePaie',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['employeurId', 'salarieId', 'mois', 'annee']
    }
  ]
});

module.exports = FichePaie;