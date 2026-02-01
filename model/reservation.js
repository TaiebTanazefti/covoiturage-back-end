export async function getReservation() {
    const reservations = await db.all(`SELECT * FROM reservation`);
    
    return reservations;
}

export async function addReservation(id, idTrajet ) {
    const resultat = await db.run(
        `INSERT INTO reservation(id, idTrajet)
        VALUES(?, ?)`,
        [id, idTrajet]
    );

}

export async function deleteReservation(idReservation) {
    const resultat = await db.run(
        `DELETE reservation
            WHERE idReservation = ?
            `,
        [idReservation]
    );

}