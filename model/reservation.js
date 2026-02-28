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