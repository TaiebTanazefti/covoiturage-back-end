import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { existsSync } from 'node:fs';

// Vérifie si le fichier de base de données est 
// nouveau (n'existe pas encore)
const IS_NEW = !existsSync(process.env.DB_FILE);

// Connexion à la base de données. Vous devez 
// spécifier le nom du fichier de base de données 
// dans le fichier .env
let db = await open({
    filename: process.env.DB_FILE,
    driver: sqlite3.Database
});

// Création de la table si elle n'existe pas, on 
// peut écrire du code SQL pour initialiser les 
// tables et données dans la fonction exec()
if(IS_NEW) {
    await db.exec(`
        CREATE TABLE utilisateur(
        id INTEGER PRIMARY KEY,
        courriel TEXT NOT NULL,
        password TEXT NOT NULL,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        role TEXT NOT NULL,
        telephone INTEGER NOT NULL,
        note INTEGER NOT NULL,
        nbreDeNotes INTEGER NOT NULL
        );

        CREATE TABLE reservation(
        id INTEGER PRIMARY KEY,
        statut TEXT NOT NULL,
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id),
        FOREIGN KEY (trajet_id) REFERENCES trajet(id)

        );

        CREATE TABLE trajet(
        id INTEGER PRIMARY KEY
        pointDeDepart TEXT NOT NULL,
        pointDarrivee TEXT NOT NULL,
        dateEtHeure DATETIME NOT NULL,
        nombreDePlacesDisponibles INTEGER NOT NULL,
        statut TEXT NOT NULL,
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)

        );

    `);
}

export { db }

/*  CREATE TABLE trajet(
        pointDeDepart TEXT NOT NULL,
        pointDarrivee TEXT NOT NULL,
        dateEtHeure DATETIME NOT NULL,
        nombreDePlacesDisponibles INT NOT NULL
        ) 
        */