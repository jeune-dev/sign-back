const { Contrat, Utilisateur, Document, ContratTravail } = require('../../models');
const sequelize         = require('../../config/db');
const { Op }            = require('sequelize');

class DashboardProfessionnelService {

    // ============================================================
        // 🔹 NOMBRE DE CONTRAT IMMOBILIER
    // ============================================================
    static async getNombreContratsImmobilier({ utilisateurConnecte }) {
        try {
            const nombreContratsImmobilier = await Contrat.count({
                where: { bailleurId: utilisateurConnecte.id }
            });

            return { success: true, data: { nombreContratsImmobilier } };

        } catch (error) {
            return { success: false, error: 'Erreur lors de la récupération des contrats immobiliers' };
        }
    }

    // ============================================================
        // 🔹 NOMBRE DE CONTRAT TRAVAIL
    // ============================================================
    static async getNombreContratsTravail({ utilisateurConnecte }) {
        try {
            const nombreContratsTravail = await ContratTravail.count({
                where: { employeurId: utilisateurConnecte.id }
            });

            return { success: true, data: { nombreContratsTravail } };

        } catch (error) {
            return { success: false, error: 'Erreur lors de la récupération des contrats de travail' };
        }
    }

    // ============================================================
        // 🔹 NOMBRE DE FACTURE
    // ============================================================
    static async getNombreFactures({ utilisateurConnecte }) {
        try {
            const nombreFactures = await Document.count({
                where: { professionnelId: utilisateurConnecte.id }
            });
            return { success: true, data: { nombreFactures } };
        } catch (error) {
            console.error('❌ Erreur getNombreFactures:', error);
            return { success: false, error: 'Erreur lors de la récupération du nombre de factures' };
        }
    }
    
}

module.exports = DashboardProfessionnelService;