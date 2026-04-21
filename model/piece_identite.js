import { db } from '../db/db.js';

/**
 * @function addPieceIdentite
 * @description Ajoute une nouvelle pièce d'identité pour un utilisateur avec le statut EN_ATTENTE.
 *              La date de soumission est définie automatiquement à la date et heure actuelles.
 * @param {number} utilisateur_id - L'identifiant de l'utilisateur qui soumet la pièce.
 * @param {string|null} image_data - Les données de l'image en base64 (optionnel).
 * @returns {Promise<number>} L'identifiant de la nouvelle pièce d'identité créée.
 */
export async function addPieceIdentite(utilisateur_id, image_data = null) {
  const date_soumission = new Date().toISOString();
  const resultat = await db.run(
    `INSERT INTO piece_identite(utilisateur_id, statut, date_soumission, image_data)
     VALUES(?, 'EN_ATTENTE', ?, ?)`,
    [utilisateur_id, date_soumission, image_data]
  );
  return resultat.lastID;
}

/**
 * @function getPiecesParUtilisateur
 * @description Retourne toutes les pièces d'identité soumises par un utilisateur,
 *              triées par date de soumission décroissante (la plus récente en premier).
 * @param {number} utilisateur_id - L'identifiant de l'utilisateur.
 * @returns {Promise<Array>} La liste des pièces d'identité (sans les données image).
 */
export async function getPiecesParUtilisateur(utilisateur_id) {
  const rows = await db.all(
    `SELECT id, utilisateur_id, statut, date_soumission FROM piece_identite WHERE utilisateur_id = ? ORDER BY date_soumission DESC`,
    [utilisateur_id]
  );
  return rows;
}

/**
 * @function getDernierePieceParUtilisateur
 * @description Retourne la dernière pièce d'identité soumise par un utilisateur,
 *              incluant les données image. Utilisée par l'administrateur pour la validation.
 * @param {number} utilisateur_id - L'identifiant de l'utilisateur.
 * @returns {Promise<Object|undefined>} La dernière pièce d'identité avec image, ou undefined si aucune.
 */
export async function getDernierePieceParUtilisateur(utilisateur_id) {
  const row = await db.get(
    `SELECT id, utilisateur_id, statut, date_soumission, image_data FROM piece_identite WHERE utilisateur_id = ? ORDER BY date_soumission DESC LIMIT 1`,
    [utilisateur_id]
  );
  return row;
}
