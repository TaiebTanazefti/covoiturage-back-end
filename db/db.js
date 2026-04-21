/**
 * @file db.js
 * @description Initialisation et connexion à la base de données SQLite.
 *              Crée automatiquement les tables et les comptes par défaut
 *              (admin, conducteur, passager) lors du premier démarrage.
 *              Les variables de configuration sont lues depuis le fichier .env.
 */

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { existsSync } from 'node:fs';
import bcrypt from 'bcrypt';

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

        CREATE TABLE piece_identite(
        id INTEGER PRIMARY KEY,
        utilisateur_id INTEGER NOT NULL,
        statut TEXT NOT NULL DEFAULT 'EN_ATTENTE',
        date_soumission TEXT NOT NULL,
        image_data TEXT,
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
        );

    `);
    // Comptes par défaut (valides et actifs)
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin123!';
    const hash = await bcrypt.hash(defaultPassword, 10);

    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@collegelacite.ca';
    await db.run(
        `INSERT INTO utilisateur(courriel, password, nom, prenom, role, telephone, valide, actif)
         VALUES(?, ?, ?, ?, 'ADMIN', ?, 1, 1)`,
        [adminEmail, hash, 'Admin', 'Système', 0]
    );
    console.log('Compte admin par défaut créé:', adminEmail);

    const passagerEmail = process.env.PASSAGER_DEFAULT_EMAIL || 'passager@collegelacite.ca';
    await db.run(
        `INSERT INTO utilisateur(courriel, password, nom, prenom, role, telephone, valide, actif)
         VALUES(?, ?, ?, ?, 'PASSAGER', ?, 1, 1)`,
        [passagerEmail, hash, 'Dupont', 'Marie', 6135550001]
    );
    console.log('Compte passager par défaut créé:', passagerEmail);

    const conducteurEmail = process.env.CONDUCTEUR_DEFAULT_EMAIL || 'conducteur@collegelacite.ca';
    await db.run(
        `INSERT INTO utilisateur(courriel, password, nom, prenom, role, telephone, valide, actif)
         VALUES(?, ?, ?, ?, 'CONDUCTEUR', ?, 1, 1)`,
        [conducteurEmail, hash, 'Martin', 'Jean', 6135550002]
    );
    console.log('Compte conducteur par défaut créé:', conducteurEmail);
} else {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS piece_identite(
        id INTEGER PRIMARY KEY,
        utilisateur_id INTEGER NOT NULL,
        statut TEXT NOT NULL DEFAULT 'EN_ATTENTE',
        date_soumission TEXT NOT NULL,
        image_data TEXT,
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
        );
    `);
    try {
      await db.run('ALTER TABLE piece_identite ADD COLUMN image_data TEXT');
    } catch (_) { /* column may already exist */ }
}

export { db }

/*  CREATE TABLE trajet(
        pointDeDepart TEXT NOT NULL,
        pointDarrivee TEXT NOT NULL,
        dateEtHeure DATETIME NOT NULL,
        nombreDePlacesDisponibles INT NOT NULL
        ) 
        */