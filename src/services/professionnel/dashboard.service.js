const { Contrat, Utilisateur, Document } = require('../../models');
const sequelize         = require('../../config/db');
const { Op }            = require('sequelize');

class DashboardProfessionnelService {

    // ============================================================
        // 🔹 NOMBRE DE CONTRAT
    // ============================================================
    static async getNombreContrats({ utilisateurConnecte }) {
        try {
        const nombreContrats = await Contrat.count({
            where: { professionnelId: utilisateurConnecte.id }
        });
        return { success: true, data: { nombreContrats } };

        } catch (error) {
        console.error('❌ Erreur getNombreContrats:', error);
        return { success: false, error: 'Erreur lors de la récupération du nombre de contrats' };
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