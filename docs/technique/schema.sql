-- ============================================================
-- Schéma de la base de données - Covoiturage Collège La Cité
-- ============================================================

PRAGMA foreign_keys = ON;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS utilisateur (
    id          INTEGER PRIMARY KEY,
    courriel    TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    nom         TEXT    NOT NULL,
    prenom      TEXT    NOT NULL,
    role        TEXT    NOT NULL,           -- ADMIN | PASSAGER | CONDUCTEUR
    telephone   INTEGER NOT NULL,
    note        INTEGER NOT NULL DEFAULT 0,
    nbreDeNotes INTEGER NOT NULL DEFAULT 0,
    valide      INTEGER NOT NULL DEFAULT 0, -- 0 = en attente, 1 = validé
    actif       INTEGER NOT NULL DEFAULT 1  -- 0 = désactivé, 1 = actif
);

-- Table des trajets
CREATE TABLE IF NOT EXISTS trajet (
    id                        INTEGER  PRIMARY KEY,
    pointDeDepart             TEXT     NOT NULL,
    pointDarrivee             TEXT     NOT NULL,
    dateEtHeure               DATETIME NOT NULL,
    nombreDePlacesDisponibles INTEGER  NOT NULL,
    statut                    TEXT     NOT NULL DEFAULT 'ACTIF', -- ACTIF | ANNULE | TERMINE
    utilisateur_id            INTEGER  NOT NULL,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
);

-- Table des réservations
CREATE TABLE IF NOT EXISTS reservation (
    id             INTEGER PRIMARY KEY,
    statut         TEXT    NOT NULL, -- EN_ATTENTE | ACCEPTEE | REFUSEE | ANNULEE | TERMINEE
    trajet_id      INTEGER NOT NULL,
    utilisateur_id INTEGER NOT NULL,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id),
    FOREIGN KEY (trajet_id)      REFERENCES trajet(id)
);

-- Table des pièces d'identité
CREATE TABLE IF NOT EXISTS piece_identite (
    id             INTEGER PRIMARY KEY,
    utilisateur_id INTEGER NOT NULL,
    statut         TEXT    NOT NULL DEFAULT 'EN_ATTENTE', -- EN_ATTENTE | APPROUVEE | REFUSEE
    date_soumission TEXT   NOT NULL,
    image_data     TEXT,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
);
