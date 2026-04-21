import { db } from '../db/db.js';
import bcrypt from 'bcrypt';

/**
 * @function getUtilisateur
 * @description Retourne la liste complète de tous les utilisateurs de la base de données.
 * @returns {Promise<Array>} La liste de tous les utilisateurs.
 */
export async function getUtilisateur() {
    const utilisateurs = await db.all(`SELECT * FROM utilisateur`);
    return utilisateurs;
}

/**
 * @function getUtilisateurParCourriel
 * @description Recherche et retourne un utilisateur selon son adresse courriel.
 * @param {string} courriel - L'adresse courriel de l'utilisateur à rechercher.
 * @returns {Promise<Object|undefined>} L'utilisateur trouvé, ou undefined si inexistant.
 */
export async function getUtilisateurParCourriel(courriel) {
  const utilisateur = await db.get(
    `SELECT * FROM utilisateur WHERE courriel = ?`,
    [courriel]
  );
  return utilisateur;
}

/**
 * @function getUtilisateurParId
 * @description Recherche et retourne un utilisateur selon son identifiant unique.
 * @param {number} id - L'identifiant unique de l'utilisateur.
 * @returns {Promise<Object|undefined>} L'utilisateur trouvé, ou undefined si inexistant.
 */
export async function getUtilisateurParId(id) {
  const utilisateur = await db.get(
    `SELECT * FROM utilisateur WHERE id = ?`,
    [id]
  );
  return utilisateur;
}

/**
 * @function addUtilisateur
 * @description Ajoute un nouvel utilisateur dans la base de données.
 *              Le mot de passe est automatiquement hashé avec bcrypt avant l'insertion.
 * @param {string} courriel - L'adresse courriel de l'utilisateur.
 * @param {string} password - Le mot de passe en clair (sera hashé).
 * @param {string} nom - Le nom de famille de l'utilisateur.
 * @param {string} prenom - Le prénom de l'utilisateur.
 * @param {string} role - Le rôle de l'utilisateur (ADMIN, PASSAGER, CONDUCTEUR).
 * @param {number} telephone - Le numéro de téléphone de l'utilisateur.
 * @returns {Promise<number>} L'identifiant du nouvel utilisateur créé.
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

/**
 * @function updateUtilisateur
 * @description Met à jour les informations personnelles d'un utilisateur existant.
 * @param {string} nom - Le nouveau nom de famille.
 * @param {string} prenom - Le nouveau prénom.
 * @param {string} role - Le nouveau rôle (ADMIN, PASSAGER, CONDUCTEUR).
 * @param {string} courriel - La nouvelle adresse courriel.
 * @param {string} password - Le nouveau mot de passe (déjà hashé).
 * @param {number} id - L'identifiant de l'utilisateur à modifier.
 * @returns {Promise<number>} Le nombre de lignes modifiées.
 */
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

/**
 * @function updateNoteUtilisateur
 * @description Met à jour la note et le nombre d'évaluations d'un utilisateur.
 * @param {number} id - L'identifiant de l'utilisateur à évaluer.
 * @param {number} note - La somme totale des notes reçues.
 * @param {number} nbreDeNotes - Le nombre total d'évaluations reçues.
 * @returns {Promise<number>} Le nombre de lignes modifiées.
 */
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

/**
 * @function updateRoleUtilisateur
 * @description Met à jour le rôle d'un utilisateur (ex: passer de PASSAGER à CONDUCTEUR).
 * @param {number} id - L'identifiant de l'utilisateur.
 * @param {string} role - Le nouveau rôle à assigner (ADMIN, PASSAGER, CONDUCTEUR).
 * @returns {Promise<number>} Le nombre de lignes modifiées.
 */
export async function updateRoleUtilisateur(id, role) {
  const resultat = await db.run(
    `UPDATE utilisateur
     SET role = ?
     WHERE id = ?`,
    [role, id]
  );
  return resultat.changes;
}

/**
 * @function updatePasswordUtilisateur
 * @description Met à jour uniquement le mot de passe d'un utilisateur.
 * @param {string} password - Le nouveau mot de passe (déjà hashé).
 * @param {number} id - L'identifiant de l'utilisateur.
 * @returns {Promise<number>} Le nombre de lignes modifiées.
 */
export async function updatePasswordUtilisateur(password, id) {
    const resultat = await db.run(
        `UPDATE utilisateur
            SET password = ?
            WHERE id = ?`,
        [password, id]
    );
    return resultat.changes;
}

/**
 * @function deleteUtilisateur
 * @description Supprime définitivement un utilisateur de la base de données.
 * @param {number} id - L'identifiant de l'utilisateur à supprimer.
 * @returns {Promise<number>} Le nombre de lignes supprimées.
 */
export async function deleteUtilisateur(id) {
    const resultat = await db.run(
        `DELETE FROM utilisateur
            WHERE id = ?`,
        [id]
    );
    return resultat.changes;
}

/**
 * @function validerUtilisateur
 * @description Valide le compte d'un utilisateur (approuvé par un administrateur).
 *              Met le champ "valide" à 1 pour permettre la connexion.
 * @param {number} id - L'identifiant de l'utilisateur à valider.
 * @returns {Promise<number>} Le nombre de lignes modifiées.
 */
export async function validerUtilisateur(id) {
  const resultat = await db.run(
    `UPDATE utilisateur
     SET valide = 1
     WHERE id = ?`,
    [id]
  );
  return resultat.changes;
}

/**
 * @function getAdminValideExiste
 * @description Vérifie si au moins un administrateur validé existe dans le système.
 *              Utilisé pour le processus de bootstrap du premier admin.
 * @returns {Promise<boolean>} true si un admin validé existe, false sinon.
 */
export async function getAdminValideExiste() {
  const row = await db.get(
    `SELECT 1 FROM utilisateur WHERE role = 'ADMIN' AND valide = 1 LIMIT 1`
  );
  return !!row;
}

/**
 * @function desactiverUtilisateur
 * @description Désactive le compte d'un utilisateur sans le supprimer.
 *              L'utilisateur ne pourra plus se connecter tant que son compte est désactivé.
 * @param {number} id - L'identifiant de l'utilisateur à désactiver.
 * @returns {Promise<number>} Le nombre de lignes modifiées.
 */
export async function desactiverUtilisateur(id) {
  const resultat = await db.run(
    `UPDATE utilisateur
     SET actif = 0
     WHERE id = ?`,
    [id]
  );
  return resultat.changes;
}

/**
 * @function reactiverUtilisateur
 * @description Réactive le compte d'un utilisateur précédemment désactivé.
 *              L'utilisateur pourra à nouveau se connecter après réactivation.
 * @param {number} id - L'identifiant de l'utilisateur à réactiver.
 * @returns {Promise<number>} Le nombre de lignes modifiées.
 */
export async function reactiverUtilisateur(id) {
  const resultat = await db.run(
    `UPDATE utilisateur
     SET actif = 1
     WHERE id = ?`,
    [id]
  );
  return resultat.changes;
}