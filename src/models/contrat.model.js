const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Contrat = sequelize.define('Contrat', {

  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true
  },

  numero_contrat: {
    type:      DataTypes.STRING,
    allowNull: false,
    unique:    true
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION — BAILLEUR
  // ══════════════════════════════════════════════════════════════
  bailleurId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'utilisateur',
      key: 'id'
    }
  },

  
  // ══════════════════════════════════════════════════════════════
  // SECTION — BIEN IMMOBILIER
  // ══════════════════════════════════════════════════════════════
  bien_adresse: {
    type:      DataTypes.STRING,
    allowNull: false
  },
  bien_ville: {
    type: DataTypes.STRING
  },
  bien_code_postal: {
    type: DataTypes.STRING
  },
  bien_pays: {
    type:         DataTypes.STRING,
    defaultValue: 'Sénégal'
  },
  bien_type: {
    type: DataTypes.ENUM(
      'Appartement',
      'Maison',
      'Studio',
      'Chambre',
      'Villa',
      'Local commercial',
      'Bureau',
      'Entrepôt',
      'Terrain',
      'Autre'
    ),
    allowNull: false
  },
  bien_superficie: {
    type:    DataTypes.FLOAT,
    comment: 'En m²'
  },
  bien_nombre_pieces: {
    type: DataTypes.INTEGER
  },
  bien_etage: {
    type: DataTypes.INTEGER
  },
  bien_meuble: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false
  },
  bien_parking: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false
  },
  bien_cave: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false
  },
  bien_balcon_terrasse: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false
  },
  bien_usage: {
    type:      DataTypes.ENUM('Habitation', 'Professionnel', 'Usage mixte'),
    allowNull: false
  },
  bien_description: {
    type:    DataTypes.TEXT,
    comment: 'Description complémentaire du logement (facultatif)'
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION — DURÉE DU BAIL
  // ══════════════════════════════════════════════════════════════
  date_debut_bail: {
    type:      DataTypes.DATEONLY,
    allowNull: false
  },
  duree_bail: {
    type:    DataTypes.STRING,
    comment: '6 mois | 1 an | 2 ans | 3 ans | Autre'
  },
  
  date_fin_bail: {
    type:    DataTypes.DATEONLY,
    comment: 'Calculée automatiquement ou saisie manuellement'
  },
  renouvellement_automatique: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false
  },
  duree_preavis: {
    type:    DataTypes.STRING,
    comment: 'Ex: 1 mois, 3 mois'
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION — CONDITIONS FINANCIÈRES
  // ══════════════════════════════════════════════════════════════
  loyer_mensuel: {
    type:      DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  devise: {
    type:         DataTypes.STRING,
    defaultValue: 'FCFA'
  },
  charges_incluses: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false
  },
  montant_charges: {
    type:         DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment:      'Charges mensuelles hors loyer'
  },
  autres_charges: {
    type:    DataTypes.JSON,
    comment: '[{ label: "Eau", montant: 5000 }, ...]'
  },
  jour_paiement: {
    type:         DataTypes.INTEGER,
    defaultValue: 1,
    comment:      'Ex: 5 = le 5 de chaque mois'
  },
  periodicite_paiement: {
    type:         DataTypes.ENUM('Mensuel', 'Trimestriel', 'Semestriel', 'Annuel', 'Autre'),
    defaultValue: 'Mensuel'
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION — DÉPÔT DE GARANTIE
  // ══════════════════════════════════════════════════════════════
  depot_garantie_prevu: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false
  },
  depot_garantie_montant: {
    type:         DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  depot_garantie_date_versement: {
    type: DataTypes.DATEONLY
  },
  depot_garantie_mode_paiement: {
    type: DataTypes.ENUM('Espèces', 'Virement bancaire', 'Mobile Money', 'Chèque', 'Autre')
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION — MODALITÉS DE PAIEMENT DU LOYER
  // ══════════════════════════════════════════════════════════════
  moyen_paiement_loyer: {
    type:      DataTypes.ENUM('Espèces', 'Virement bancaire', 'Mobile Money', 'Chèque', 'Autre'),
    allowNull: false
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION — CLAUSES PARTICULIÈRES
  // ══════════════════════════════════════════════════════════════
  sous_location_autorisee: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false
  },
  animaux_autorises: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false
  },
  travaux_sans_autorisation: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false
  },
  clauses_particulieres: {
    type:    DataTypes.TEXT,
    comment: 'Texte libre si le bailleur souhaite ajouter des clauses'
  },

  // ══════════════════════════════════════════════════════════════
  // STATUT & PDF
  // ══════════════════════════════════════════════════════════════
  statut: {
    type:         DataTypes.ENUM('Actif', 'Résilié', 'Expiré', 'En attente'),
    defaultValue: 'Actif'
  },
  date_resiliation: {
    type: DataTypes.DATEONLY
  },
  motif_resiliation: {
    type: DataTypes.TEXT
  },
  contrat_pdf: {
    type:    DataTypes.TEXT('long'),
    comment: 'PDF encodé en base64'
  }

}, {
  tableName:  'Contrats',
  timestamps: true
});

module.exports = Contrat;