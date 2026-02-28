import { db } from '../db/db.js';
import bcrypt from 'bcrypt'

/**
 * Retourne la liste des tâches à faire.
 * @returns La liste des tâches à faire.
 */
export async function getUtilisateur() {
    const utilisateurs = await db.all(`SELECT * FROM utilisateur`);
    
    return utilisateurs;
}

export async function getUtilisateurParCourriel(courriel) {
  const utilisateur = await db.get(
    `SELECT * FROM utilisateur WHERE courriel = ?`,
    [courriel]
  );
  return utilisateur;
}

export async function getUtilisateurParId(id) {
  const utilisateur = await db.get(
    `SELECT * FROM utilisateur WHERE id = ?`,
    [id]
  );
  return utilisateur;
}
 
/**
 * Ajoute une tache à faire dans la liste.
 * @param {string} texte Texte de la nouvelle tâche à faire.
 * @returns L'identifiant de la nouvelle tâche créé.
 */


export async function addUtilisateur(courriel, password, nom, prenom, role, telephone) {
  const motDePasseEncrypte = await bcrypt.hash(password, 10);

  const resultat = await db.run(
    `INSERT INTO utilisateur(courriel, password, nom, prenom, role, telephone)
     VALUES(?, ?, ?, ?, ?, ?)`,
    [courriel, motDePasseEncrypte, nom, prenom, role, telephone]
  );

  return resultat.lastID;
}

export async function updateUtilisateur(nom, prenom, role, courriel, password, id) {
    const resultat = await db.run(
        `UPDATE utilisateur
            SET 
                nom = ?,
                prenom = ?,
                role = ?,
                courriel = ?,
                password = ?
            WHERE id = ?`,
        [nom, prenom, role, courriel, password, id]
    );
    return resultat.changes;
}

export async function updateNoteUtilisateur(id, note, nbreDeNotes) {
    const resultat = await db.run(
        `UPDATE utilisateur
            SET 
                note = ?,
                nbreDeNotes = ?
            WHERE id = ?`,
        [note, nbreDeNotes, id]
    );
    return resultat.changes;
}

export async function updateRoleUtilisateur(id, role) {
  const resultat = await db.run(
    `UPDATE utilisateur
     SET role = ?
     WHERE id = ?`,
    [role, id]
  );

  return resultat.changes;
}


export async function updatePasswordUtilisateur(password, id) {
    const resultat = await db.run(
        `UPDATE utilisateur
            SET password = ?
            WHERE id = ?`,
        [password, id]
    );
    return resultat.changes;
}



export async function deleteUtilisateur(id) {
    const resultat = await db.run(
        `DELETE FROM utilisateur
            WHERE id = ?`,
        [id]
    );
    return resultat.changes;
}

export async function validerUtilisateur(id) {
  const resultat = await db.run(
    `UPDATE utilisateur
     SET valide = 1
     WHERE id = ?`,
    [id]
  );

  return resultat.changes;
}


export async function desactiverUtilisateur(id) {
  const resultat = await db.run(
    `UPDATE utilisateur
     SET actif = 0
     WHERE id = ?`,
    [id]
  );
  return resultat.changes;
}

export async function reactiverUtilisateur(id) {
  const resultat = await db.run(
    `UPDATE utilisateur
     SET actif = 1
     WHERE id = ?`,
    [id]
  );
  return resultat.changes;
}


