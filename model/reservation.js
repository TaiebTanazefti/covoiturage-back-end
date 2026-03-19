import { db } from '../db/db.js';

export async function getReservation() {
  const reservations = await db.all(`SELECT * FROM reservation`);
  return reservations;
}

export async function getReservationsParUtilisateur(utilisateur_id) {
  const reservations = await db.all(
    `SELECT * FROM reservation WHERE utilisateur_id = ?`,
    [utilisateur_id]
  );
  return reservations;
}

export async function getReservationsParTrajet(trajet_id) {
  const reservations = await db.all(
    `SELECT * FROM reservation WHERE trajet_id = ?`,
    [trajet_id]
  );
  return reservations;
}

export async function getReservationParId(id) {
  const reservation = await db.get(
    `SELECT * FROM reservation WHERE id = ?`,
    [id]
  );
  return reservation;
}

export async function annulerReservation(id) {
  const resultat = await db.run(
    `UPDATE reservation
     SET statut = 'ANNULEE'
     WHERE id = ? AND statut != 'ANNULEE'`,
    [id]
  );

  return resultat.changes; // 1 si ok, 0 sinon
}

export async function addReservation(trajet_id, utilisateur_id  ) {
    const resultat = await db.run(
        `INSERT INTO reservation(trajet_id, statut, utilisateur_id )
        VALUES(?, "EN_ATTENTE", ?)`,
        [trajet_id, utilisateur_id ]
    );
    return resultat.lastID;

}

export async function updateStatutReservation(id, statut) {
    const resultat = await db.run(
        `UPDATE reservation 
            SET statut = ?
            WHERE id = ?`,
        [statut, id]
    );
    return resultat.changes;
}

export async function deleteReservation(id) {
    const resultat = await db.run(
        `DELETE  FROM reservation
            WHERE id = ?
            `,
        [id]
    );

}

export async function getReservationParTrajetEtUtilisateur(trajet_id, utilisateur_id) {
  const r = await db.get(
    `SELECT * FROM reservation WHERE trajet_id = ? AND utilisateur_id = ? AND statut != 'ANNULEE'`,
    [trajet_id, utilisateur_id]
  );
  return r;
}

export async function accepterReservation(id) {
  const resultat = await db.run(
    `UPDATE reservation
     SET statut = 'ACCEPTEE'
     WHERE id = ? AND statut = 'EN_ATTENTE'`,
    [id]
  );

  return resultat.changes; // 1 si ok, 0 sinon
}

export async function refuserReservation(id) {
  const resultat = await db.run(
    `UPDATE reservation
     SET statut = 'REFUSEE'
     WHERE id = ? AND statut = 'EN_ATTENTE'`,
    [id]
  );

  return resultat.changes; // 1 si ok, 0 sinon
}

/** True if me and target had a completed trip together (ACCEPTEE, trip date in the past). */
export async function aEuTrajetCompleteAvec(meId, targetId) {
  const row = await db.get(
    `SELECT 1 FROM reservation r
     INNER JOIN trajet t ON r.trajet_id = t.id
     WHERE r.statut = 'ACCEPTEE'
       AND datetime(t.dateEtHeure) < datetime('now')
       AND ((r.utilisateur_id = ? AND t.utilisateur_id = ?) OR (r.utilisateur_id = ? AND t.utilisateur_id = ?))
     LIMIT 1`,
    [meId, targetId, targetId, meId]
  );
  return !!row;
}