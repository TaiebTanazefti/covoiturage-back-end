
export async function getTrajet() {
    const trajets = await db.all(`SELECT * FROM trajet`);
    
    return trajets;
}

export async function addTrajet(pointDeDepart, pointDarrivee, dateEtHeure, nombreDePlacesDisponibles ) {
    const resultat = await db.run(
        `INSERT INTO trajet(pointDeDepart, pointDarrivee, dateEtHeure, nombreDePlacesDisponibles)
        VALUES(?, ?, ?, ?)`,
        [pointDeDepart, pointDarrivee, dateEtHeure, nombreDePlacesDisponibles]
    );

}

export async function updateTrajet(idTrajet, pointDeDepart, pointDarrivee, dateEtHeure, nombreDePlacesDisponibles) {
    const resultat = await db.run(
        `UPDATE trajet
            SET 
                pointDeDepart = ?,
                pointDarrivee = ?,
                dateEtHeure = ?,
                nombreDePlacesDisponibles = ?,
                
            WHERE idTrajet = ?
            `,
        [idTrajet, pointDeDepart, pointDarrivee, dateEtHeure, nombreDePlacesDisponibles]
    );

}

export async function deleteTrajet(idTrajet) {
    const resultat = await db.run(
        `DELETE trajet
            WHERE idTrajet = ?
            `,
        [idTrajet]
    );

}