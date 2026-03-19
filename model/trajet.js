
import { db } from '../db/db.js';

export async function getTrajet() {
  const trajets = await db.all(`SELECT * FROM trajet`);
  return trajets;
}

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

export async function addTrajet(pointDeDepart, pointDarrivee, dateEtHeure, nombreDePlacesDisponibles, utilisateur_id) {
  const resultat = await db.run(
    `INSERT INTO trajet(pointDeDepart, pointDarrivee, dateEtHeure, nombreDePlacesDisponibles, statut, utilisateur_id)
     VALUES(?, ?, ?, ?, 'ACTIF', ?)`,
    [pointDeDepart, pointDarrivee, dateEtHeure, nombreDePlacesDisponibles, utilisateur_id]
  );

  return resultat.lastID;
}

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

export async function updateStatutTrajet(id, statut) {
    const resultat = await db.run(
        `UPDATE trajet 
            SET statut = ?
            WHERE id = ?`,
        [statut, id]
    );
    return resultat.changes;
}

export async function deleteTrajet(id) {
    const resultat = await db.run(
        `DELETE FROM trajet
            WHERE id = ?`,
        [id]
    );
    return resultat.changes;
}

export async function getTrajetsParUtilisateur(utilisateur_id) {
  const trajets = await db.all(
    `SELECT * FROM trajet WHERE utilisateur_id = ?`,
    [utilisateur_id]
  );

  return trajets;
}

export async function getTrajetParId(id) {
  const trajet = await db.get(
    `SELECT * FROM trajet WHERE id = ?`,
    [id]
  );

  return trajet;
}

export async function decrementerPlacesTrajet(id) {
  const resultat = await db.run(
    `UPDATE trajet
     SET nombreDePlacesDisponibles = nombreDePlacesDisponibles - 1
     WHERE id = ? AND nombreDePlacesDisponibles > 0 AND statut = 'ACTIF'`,
    [id]
  );


  
  // resultat.changes = nombre de lignes modifiées
  return resultat.changes;
}

export async function incrementerPlacesTrajet(id) {
  const resultat = await db.run(
    `UPDATE trajet
     SET nombreDePlacesDisponibles = nombreDePlacesDisponibles + 1
     WHERE id = ? AND statut = 'ACTIF'`,
    [id]
  );

  return resultat.changes;
}