import { db } from '../db/db.js';

export async function addPieceIdentite(utilisateur_id, image_data = null) {
  const date_soumission = new Date().toISOString();
  const resultat = await db.run(
    `INSERT INTO piece_identite(utilisateur_id, statut, date_soumission, image_data)
     VALUES(?, 'EN_ATTENTE', ?, ?)`,
    [utilisateur_id, date_soumission, image_data]
  );
  return resultat.lastID;
}

export async function getPiecesParUtilisateur(utilisateur_id) {
  const rows = await db.all(
    `SELECT id, utilisateur_id, statut, date_soumission FROM piece_identite WHERE utilisateur_id = ? ORDER BY date_soumission DESC`,
    [utilisateur_id]
  );
  return rows;
}

/** Latest piece (with image) for a user – for admin validation. */
export async function getDernierePieceParUtilisateur(utilisateur_id) {
  const row = await db.get(
    `SELECT id, utilisateur_id, statut, date_soumission, image_data FROM piece_identite WHERE utilisateur_id = ? ORDER BY date_soumission DESC LIMIT 1`,
    [utilisateur_id]
  );
  return row;
}
