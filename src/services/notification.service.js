const admin = require('firebase-admin');
const DeviceToken = require('../models/deviceToken.model');

// Initialise Firebase Admin une seule fois
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    : null;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT_JSON non défini — notifications push désactivées');
  }
}

/**
 * Envoie une notification push à un ou plusieurs utilisateurs.
 * @param {string|string[]} utilisateurIds
 * @param {{ title: string, body: string, data?: Record<string,string> }} payload
 */
async function sendPushToUsers(utilisateurIds, { title, body, data = {} }) {
  if (!admin.apps.length) return;

  const ids = Array.isArray(utilisateurIds) ? utilisateurIds : [utilisateurIds];

  const rows = await DeviceToken.findAll({
    where: { utilisateurId: ids },
    attributes: ['token']
  });

  if (!rows.length) return;

  const tokens = rows.map(r => r.token);

  const message = {
    notification: { title, body },
    data: { ...data },               // data doit être Record<string,string>
    tokens
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    // Supprimer les tokens invalides (désinstallations, etc.)
    const invalidTokens = [];
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const code = res.error?.code;
        if (
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    if (invalidTokens.length) {
      await DeviceToken.destroy({ where: { token: invalidTokens } });
    }

    console.log(`[FCM] ${response.successCount}/${tokens.length} notifs envoyées — "${title}"`);
  } catch (err) {
    console.error('[FCM] Erreur envoi:', err.message);
  }
}

/**
 * Sauvegarde ou met à jour le token FCM d'un utilisateur.
 * Un utilisateur peut avoir plusieurs devices.
 */
async function saveDeviceToken(utilisateurId, token, platform = 'android') {
  await DeviceToken.upsert(
    { utilisateurId, token, platform },
    { conflictFields: ['token'] }   // Si le token existe déjà, on met à jour utilisateurId
  );
}

module.exports = { sendPushToUsers, saveDeviceToken };
