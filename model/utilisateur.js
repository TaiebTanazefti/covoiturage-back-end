import { db } from '../db/db.js';

/**
 * Retourne la liste des tâches à faire.
 * @returns La liste des tâches à faire.
 */
export async function getUtilisateur() {
    const utilisateurs = await db.all(`SELECT * FROM utilisateur`);
    
    return utilisateurs;
}

/**
 * Ajoute une tache à faire dans la liste.
 * @param {string} texte Texte de la nouvelle tâche à faire.
 * @returns L'identifiant de la nouvelle tâche créé.
 */
export async function addUtilisateur(courriel, password, nom, prenom, role) {
    const resultat = await db.run(
        `INSERT INTO utilisateur(courriel, password, nom, prenom, role)
        VALUES(?, ?, ?, ?, ?)`,
        [courriel, password, nom, prenom, role]
    );

}

export async function updateUtilisateur(nom, prenom, role, courriel, password, id) {
    const resultat = await db.run(
        `UPDATE utilisateur
            SET 
                nom = ?,
                prenom = ?,
                role = ?,
                courriel = ?,
                password = ?,
            WHERE id = ?
            `,
        [nom, prenom, role, courriel, password, id]
    );

}

export async function patchUtilisateur(password, id) {
    const resultat = await db.run(
        `UPDATE utilisateur
            SET password = ?,
            WHERE id = ?
            `,
        [password, id]
    );

}



export async function deleteUtilisateur(id) {
    const resultat = await db.run(
        `DELETE utilisateur
            WHERE id = ?
            `,
        [id]
    );
}





