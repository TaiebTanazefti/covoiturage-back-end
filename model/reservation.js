import { db } from '../db/db.js';

/**
 * @function getReservation
 * @description Retourne la liste complète de toutes les réservations de la base de données.
 * @returns {Promise<Array>} La liste de toutes les réservations.
 */
export async function getReservation() {
  const reservations = await db.all(`SELECT * FROM reservation`);
  return reservations;
}

/**
 * @function getReservationsParUtilisateur
 * @description Retourne toutes les réservations effectuées par un utilisateur spécifique.
 * @param {number} utilisateur_id - L'identifiant de l'utilisateur (passager).
 * @returns {Promise<Array>} La liste des réservations de l'utilisateur.
 */
export async function getReservationsParUtilisateur(utilisateur_id) {
  const reservations = await db.all(
    `SELECT * FROM reservation WHERE utilisateur_id = ?`,
    [utilisateur_id]
  );
  return reservations;
}

/**
 * @function getReservationsParTrajet
 * @description Retourne toutes les réservations associées à un trajet spécifique.
 * @param {number} trajet_id - L'identifiant du trajet.
 * @returns {Promise<Array>} La liste des réservations pour ce trajet.
 */
export async function getReservationsParTrajet(trajet_id) {
  const reservations = await db.all(
    `SELECT * FROM reservation WHERE trajet_id = ?`,
    [trajet_id]
  );
  return reservations;
}

/**
 * @function getReservationParId
 * @description Recherche et retourne une réservation selon son identifiant unique.
 * @param {number} id - L'identifiant unique de la réservation.
 * @returns {Promise<Object|undefined>} La réservation trouvée, ou undefined si inexistante.
 */
export async function getReservationParId(id) {
  const reservation = await db.get(
    `SELECT * FROM reservation WHERE id = ?`,
    [id]
  );
  return reservation;
}

/**
 * @function annulerReservation
 * @description Annule une réservation en changeant son statut à ANNULEE.
 *              La mise à jour est ignorée si la réservation est déjà annulée.
 * @param {number} id - L'identifiant de la réservation à annuler.
 * @returns {Promise<number>} Le nombre de lignes modifiées (1 si succès, 0 sinon).
 */
export async function annulerReservation(id) {
  const resultat = await db.run(
    `UPDATE reservation
     SET statut = 'ANNULEE'
     WHERE id = ? AND statut != 'ANNULEE'`,
    [id]
  );
  return resultat.changes;
}

/**
 * @function addReservation
 * @description Crée une nouvelle réservation avec le statut EN_ATTENTE par défaut.
 * @param {number} trajet_id - L'identifiant du trajet réservé.
 * @param {number} utilisateur_id - L'identifiant du passager qui réserve.
 * @returns {Promise<number>} L'identifiant de la nouvelle réservation créée.
 */
export async function addReservation(trajet_id, utilisateur_id) {
    const resultat = await db.run(
        `INSERT INTO reservation(trajet_id, statut, utilisateur_id)
        VALUES(?, "EN_ATTENTE", ?)`,
        [trajet_id, utilisateur_id]
    );
    return resultat.lastID;
}

/**
 * @function updateStatutReservation
 * @description Met à jour le statut d'une réservation existante.
 * @param {number} id - L'identifiant de la réservation à modifier.
 * @param {string} statut - Le nouveau statut (EN_ATTENTE, ACCEPTEE, REFUSEE, ANNULEE).
 * @returns {Promise<number>} Le nombre de lignes modifiées.
 */
export async function updateStatutReservation(id, statut) {
    const resultat = await db.run(
        `UPDATE reservation 
            SET statut = ?
            WHERE id = ?`,
        [statut, id]
    );
    return resultat.changes;
}

/**
 * @function deleteReservation
 * @description Supprime définitivement une réservation de la base de données.
 * @param {number} id - L'identifiant de la réservation à supprimer.
 * @returns {Promise<void>}
 */
export async function deleteReservation(id) {
    const resultat = await db.run(
        `DELETE FROM reservation
            WHERE id = ?`,
        [id]
    );
}

/**
 * @function getReservationParTrajetEtUtilisateur
 * @description Vérifie si un utilisateur a déjà une réservation active pour un trajet donné.
 *              Utilisé pour empêcher les doubles réservations.
 * @param {number} trajet_id - L'identifiant du trajet.
 * @param {number} utilisateur_id - L'identifiant de l'utilisateur.
 * @returns {Promise<Object|undefined>} La réservation existante, ou undefined si aucune.
 */
export async function getReservationParTrajetEtUtilisateur(trajet_id, utilisateur_id) {
  const r = await db.get(
    `SELECT * FROM reservation WHERE trajet_id = ? AND utilisateur_id = ? AND statut != 'ANNULEE'`,
    [trajet_id, utilisateur_id]
  );
  return r;
}

/**
 * @function accepterReservation
 * @description Accepte une réservation en attente en changeant son statut à ACCEPTEE.
 *              Seules les réservations avec le statut EN_ATTENTE peuvent être acceptées.
 * @param {number} id - L'identifiant de la réservation à accepter.
 * @returns {Promise<number>} Le nombre de lignes modifiées (1 si succès, 0 sinon).
 */
export async function accepterReservation(id) {
  const resultat = await db.run(
    `UPDATE reservation
     SET statut = 'ACCEPTEE'
     WHERE id = ? AND statut = 'EN_ATTENTE'`,
    [id]
  );
  return resultat.changes;
}

/**
 * @function refuserReservation
 * @description Refuse une réservation en attente en changeant son statut à REFUSEE.
 *              Seules les réservations avec le statut EN_ATTENTE peuvent être refusées.
 * @param {number} id - L'identifiant de la réservation à refuser.
 * @returns {Promise<number>} Le nombre de lignes modifiées (1 si succès, 0 sinon).
 */
export async function refuserReservation(id) {
  const resultat = await db.run(
    `UPDATE reservation
     SET statut = 'REFUSEE'
     WHERE id = ? AND statut = 'EN_ATTENTE'`,
    [id]
  );
  return resultat.changes;
}

/**
 * @function aEuTrajetCompleteAvec
 * @description Vérifie si deux utilisateurs ont effectué un trajet ensemble dans le passé.
 *              Un trajet est considéré complété dans deux cas :
 *              - La réservation a le statut TERMINEE (conducteur a terminé le trajet manuellement), ou
 *              - La réservation est ACCEPTEE et la date du trajet est déjà passée.
 *              Utilisé pour autoriser la notation entre utilisateurs.
 * @param {number} meId - L'identifiant du premier utilisateur.
 * @param {number} targetId - L'identifiant du deuxième utilisateur.
 * @returns {Promise<boolean>} true si les deux ont partagé un trajet complété, false sinon.
 */
export async function aEuTrajetCompleteAvec(meId, targetId) {
  const row = await db.get(
    `SELECT 1 FROM reservation r
     INNER JOIN trajet t ON r.trajet_id = t.id
     WHERE (r.statut = 'TERMINEE' OR (r.statut = 'ACCEPTEE' AND datetime(t.dateEtHeure) < datetime('now')))
       AND ((r.utilisateur_id = ? AND t.utilisateur_id = ?) OR (r.utilisateur_id = ? AND t.utilisateur_id = ?))
     LIMIT 1`,
    [meId, targetId, targetId, meId]
  );
  return !!row;
}