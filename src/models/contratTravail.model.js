const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ContratTravail = sequelize.define('ContratTravail', {

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
  // SECTION — EMPLOYEUR
  // ══════════════════════════════════════════════════════════════
    employeurId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
        model: 'utilisateur',
        key: 'id'
        }
    },

  // ══════════════════════════════════════════════════════════════
  // SECTION — SALARIE
  // ══════════════════════════════════════════════════════════════
    salarieId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'utilisateur',
            key: 'id'
        }
    },
  
  // ══════════════════════════════════════════════════════════════
  // SECTION — CONTRTAT TRAVAIL
  // ══════════════════════════════════════════════════════════════
    poste: {
        type: DataTypes.STRING,
        allowNull: false
    },

    missions: {
        type: DataTypes.JSON,
        allowNull: false,    
    },

    lieu_travail: {
        type: DataTypes.STRING,
        allowNull: false
    },

    type_contrat: {
        type: DataTypes.ENUM('CDI', 'CDD', 'Stage', 'Freelance', 'Intérim'),
        defaultValue: 'CDI'
    },

    // Format JSON : [{ jour, debut:"HH:MM:SS", fin:"HH:MM:SS" }, ...]
    jour_travail: {
        type:      DataTypes.JSON,
        allowNull: false
    },

    temps_pause: {
        type: DataTypes.STRING,
        allowNull: true
    },

    date_debut: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    date_fin: {
        type: DataTypes.DATEONLY,
        allowNull: true   // Null pour les CDI sans date de fin
    },

    salaire_mensuel: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },

    moyen_paiement: {
        type: DataTypes.ENUM('Espèces', 'Virement bancaire', 'Mobile Money', 'Chèque', 'ALL', 'Autre'),
        allowNull: false
    },

    nbr_jours_conges: {
        type:         DataTypes.INTEGER,
        defaultValue: 0,    // Défaut 0 si non renseigné
        allowNull: false
    },

    remuneration_jours_feries: {
        type: DataTypes.ENUM('rémunérés', 'non rémunérés', 'travail_effectif'),
        defaultValue: 'rémunérés',
        allowNull: false
    },

    remuneration_absences_maladie: {
        type: DataTypes.ENUM('rémunérés', 'non rémunérés', 'sous_conditions'),
        defaultValue: 'rémunérés',
        allowNull: false
    },

    avance_salaire: {
        type:         DataTypes.BOOLEAN,
        defaultValue: false
    },

    avantages_salarial: {
        type: DataTypes.JSON,
        allowNull: true,    
    },

    duree_preavis: {
        type: DataTypes.STRING,
        allowNull: true
    },

    assurance_maladie: {
        type:   DataTypes.JSON,
        defaultValue: false
    },

    clauses: {
        type: DataTypes.JSON,
        allowNull: true
    },

    contrat_pdf: {
        type:    DataTypes.STRING(500),
    },

    date_signature: {
        type: DataTypes.DATEONLY
    },

    lieu_signature: {
        type: DataTypes.STRING
    },
    signature_employeur: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },

    signature_salarie: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    statut: {
        type: DataTypes.ENUM('en_attente', 'signe'),
        defaultValue: 'en_attente',
        allowNull: false
    },
}, {
  tableName:  'ContratTravail',
  timestamps: true
});

module.exports = ContratTravail;