const DashboardProfessionnelService = require('../../services/professionnel/dashboard.service');

class DashboardProfessionnelController {

    // ============================================================
    // 🔹 NOMBRE DE CONTRATS
    // ============================================================
    static async getNombreContrats(req, res) {
        try {
            const utilisateurConnecte = req.user; // supposé injecté par middleware auth

            const result = await DashboardProfessionnelService.getNombreContrats({
                utilisateurConnecte
            });

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('❌ Controller getNombreContrats:', error);
            return res.status(500).json({
                success: false,
                error: 'Erreur serveur'
            });
        }
    }

    // ============================================================
    // 🔹 NOMBRE DE FACTURES
    // ============================================================
    static async getNombreFactures(req, res) {
        try {
            const utilisateurConnecte = req.user;

            const result = await DashboardProfessionnelService.getNombreFactures({
                utilisateurConnecte
            });

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('❌ Controller getNombreFactures:', error);
            return res.status(500).json({
                success: false,
                error: 'Erreur serveur'
            });
        }
    }
}

module.exports = DashboardProfessionnelController;