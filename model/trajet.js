import { db } from '../db/db.js';

/**
 * @function getTrajet
 * @description Retourne la liste complète de tous les trajets de la base de données.
 * @returns {Promise<Array>} La liste de tous les trajets.
 */
export async function getTrajet() {
  const trajets = await db.all(`SELECT * FROM trajet`);
  return trajets;
}

/**
 * @function getTrajetFiltres
 * @description Recherche les trajets actifs selon des critères de filtrage optionnels.
 *              Les résultats sont triés par date et heure de départ croissante.
 * @param {string|null} pointDeDepart - Filtre partiel sur le point de départ (optionnel).
 * @param {string|null} pointDarrivee - Filtre partiel sur le point d'arrivée (optionnel).
 * @param {string|null} date - Filtre sur la date au format YYYY-MM-DD (optionnel).
 * @returns {Promise<Array>} La liste des trajets actifs correspondant aux filtres.
 */
export async function getTrajetFiltres(pointDeDepart, pointDarrivee, date) {
  let sql = `SELECT * FROM trajet WHERE statut = 'ACTIF'`;
  const params = [];
  if (pointDeDepart) {
    sql += ` AND pointDeDepart LIKE ?`;
    params.push(`%${pointDeDepart}%`);
  }
  if (pointDarrivee) {
    sql += ` AND pointDarrivee LIKE ?`;
    params.push(`%${pointDarrivee}%`);
  }
  if (date) {
    sql += ` AND date(dateEtHeure) = date(?)`;
    params.push(date);
  }
  sql += ` ORDER BY dateEtHeure ASC`;
  const trajets = await db.all(sql, params);
  return trajets;
}

/**
 * @function addTrajet
 * @description Ajoute un nouveau trajet dans la base de données avec le statut ACTIF par défaut.
 * @param {string} pointDeDepart - L'adresse du point de départ du trajet.
 * @param {string} pointDarrivee - L'adresse du point d'arrivée du trajet.
 * @param {string} dateEtHeure - La date et l'heure de départ au format ISO (YYYY-MM-DDTHH:mm).
 * @param {number} nombreDePlacesDisponibles - Le nombre de places disponibles pour les passagers.
 * @param {number} utilisateur_id - L'identifiant du conducteur qui crée le trajet.
 * @returns {Promise<number>} L'identifiant du nouveau trajet créé.
 */
export async function addTrajet(pointDeDepart, pointDarrivee, dateEtHeure, nombreDePlacesDisponibles, utilisateur_id) {
  const resultat = await db.run(
    `INSERT INTO trajet(pointDeDepart, pointDarrivee, dateEtHeure, nombreDePlacesDisponibles, statut, utilisateur_id)
     VALUES(?, ?, ?, ?, 'ACTIF', ?)`,
    [pointDeDepart, pointDarrivee, dateEtHeure, nombreDePlacesDisponibles, utilisateur_id]
  );
  return resultat.lastID;
}

/**
 * @function updateTrajet
 * @description Met à jour les informations d'un trajet existant.
 * @param {number} id - L'identifiant du trajet à modifier.
 * @param {string} pointDeDepart - Le nouveau point de départ.
 * @param {string} pointDarrivee - Le nouveau point d'arrivée.
 * @param {string} dateEtHeure - La nouvelle date et heure de départ.
 * @param {number} nombreDePlacesDisponibles - Le nouveau nombre de places disponibles.
 * @returns {Promise<number>} Le nombre de lignes modifiées.
 */
export async function updateTrajet(id, pointDeDepart, pointDarrivee, dateEtHeure, nombreDePlacesDisponibles) {
    const resultat = await db.run(
        `UPDATE trajet
            SET 
                pointDeDepart = ?,
                pointDarrivee = ?,
                dateEtHeure = ?,
                nombreDePlacesDisponibles = ?
            WHERE id = ?`,
        [pointDeDepart, pointDarrivee, dateEtHeure, nombreDePlacesDisponibles, id]
    );
    return resultat.changes;
}

/**
 * @function updateStatutTrajet
 * @description Met à jour le statut d'un trajet (ACTIF ou ANNULE).
 * @param {number} id - L'identifiant du trajet à modifier.
 * @param {string} statut - Le nouveau statut du trajet (ACTIF, ANNULE).
 * @returns {Promise<number>} Le nombre de lignes modifiées.
 */
export async function updateStatutTrajet(id, statut) {
    const resultat = await db.run(
        `UPDATE trajet 
            SET statut = ?
            WHERE id = ?`,
        [statut, id]
    );
    return resultat.changes;
}

/**
 * @function deleteTrajet
 * @description Supprime définitivement un trajet de la base de données.
 * @param {number} id - L'identifiant du trajet à supprimer.
 * @returns {Promise<number>} Le nombre de lignes supprimées.
 */
export async function deleteTrajet(id) {
    const resultat = await db.run(
        `DELETE FROM trajet
            WHERE id = ?`,
        [id]
    );
    return resultat.changes;
}

/**
 * @function getTrajetsParUtilisateur
 * @description Retourne tous les trajets créés par un conducteur spécifique.
 * @param {number} utilisateur_id - L'identifiant du conducteur.
 * @returns {Promise<Array>} La liste des trajets du conducteur.
 */
export async function getTrajetsParUtilisateur(utilisateur_id) {
  const trajets = await db.all(
    `SELECT * FROM trajet WHERE utilisateur_id = ?`,
    [utilisateur_id]
  );
  return trajets;
}

/**
 * @function getTrajetParId
 * @description Recherche et retourne un trajet selon son identifiant unique.
 * @param {number} id - L'identifiant unique du trajet.
 * @returns {Promise<Object|undefined>} Le trajet trouvé, ou undefined si inexistant.
 */
export async function getTrajetParId(id) {
  const trajet = await db.get(
    `SELECT * FROM trajet WHERE id = ?`,
    [id]
  );
  return trajet;
}

/**
 * @function decrementerPlacesTrajet
 * @description Décrémente de 1 le nombre de places disponibles d'un trajet actif.
 *              La mise à jour n'est effectuée que si le trajet est ACTIF et qu'il reste des places.
 * @param {number} id - L'identifiant du trajet.
 * @returns {Promise<number>} Le nombre de lignes modifiées (0 si aucune place disponible).
 */
export async function decrementerPlacesTrajet(id) {
  const resultat = await db.run(
    `UPDATE trajet
     SET nombreDePlacesDisponibles = nombreDePlacesDisponibles - 1
     WHERE id = ? AND nombreDePlacesDisponibles > 0 AND statut = 'ACTIF'`,
    [id]
  );
  return resultat.changes;
}

/**
 * @function incrementerPlacesTrajet
 * @description Incrémente de 1 le nombre de places disponibles d'un trajet actif.
 *              Appelée lors de l'annulation ou du refus d'une réservation.
 * @param {number} id - L'identifiant du trajet.
 * @returns {Promise<number>} Le nombre de lignes modifiées.
 */
export async function incrementerPlacesTrajet(id) {
  const resultat = await db.run(
    `UPDATE trajet
     SET nombreDePlacesDisponibles = nombreDePlacesDisponibles + 1
     WHERE id = ? AND statut = 'ACTIF'`,
    [id]
  );
  return resultat.changes;
}