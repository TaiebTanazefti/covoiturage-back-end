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
await db.exec('PRAGMA foreign_keys = ON;');
// Création de la table si elle n'existe pas, on 
// peut écrire du code SQL pour initialiser les 
// tables et données dans la fonction exec()
// statuts possibles de reservation : EN_ATTENTE/ ACCEPTEE/ REFUSEE/ ANNULEE
// status possibles de trajet : ACTIF / ANNULE
if(IS_NEW) {
    await db.exec(`
        CREATE TABLE utilisateur(
        id INTEGER PRIMARY KEY,
        courriel TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        role TEXT NOT NULL,
        telephone INTEGER NOT NULL,
        note INTEGER  NOT NULL DEFAULT 0,
        nbreDeNotes INTEGER NOT NULL DEFAULT 0,
        valide INTEGER NOT NULL DEFAULT 0,
        actif INTEGER NOT NULL DEFAULT 1
        );

        
        CREATE TABLE reservation(
        id INTEGER PRIMARY KEY,
        statut TEXT NOT NULL,
        trajet_id INTEGER NOT NULL,
        utilisateur_id INTEGER NOT NULL,
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id),
        FOREIGN KEY (trajet_id) REFERENCES trajet(id)

        );

        CREATE TABLE trajet(
        id INTEGER PRIMARY KEY,
        pointDeDepart TEXT NOT NULL,
        pointDarrivee TEXT NOT NULL,
        dateEtHeure DATETIME NOT NULL,
        nombreDePlacesDisponibles INTEGER NOT NULL,
        statut TEXT NOT NULL DEFAULT 'ACTIF',
        utilisateur_id INTEGER NOT NULL,
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