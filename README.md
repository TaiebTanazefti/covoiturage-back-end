# Covoiturage — Collège La Cité

Application de covoiturage développée dans le cadre du cours au Collège La Cité.

---

## Prérequis

- [Node.js](https://nodejs.org) v18 ou plus récent
- npm (inclus avec Node.js)

---

## Installation et déploiement sur un nouveau serveur

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd covoiturage-back-end
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Copier le fichier `.env.example` et le renommer `.env` :

```bash
cp .env.example .env
```

Modifier le fichier `.env` selon vos besoins :

```env
DB_FILE=./db/database.sqlite
PORT=3000
SESSION_SECRET=changez_ce_secret_en_production
ADMIN_DEFAULT_EMAIL=admin@collegelacite.ca
ADMIN_DEFAULT_PASSWORD=Admin123!
PASSAGER_DEFAULT_EMAIL=passager@collegelacite.ca
CONDUCTEUR_DEFAULT_EMAIL=conducteur@collegelacite.ca
```

> **Important** : Changer `SESSION_SECRET` par une valeur secrète unique en production.

### 4. Démarrer le serveur

```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

> La base de données SQLite est **créée automatiquement** au premier démarrage avec les tables et les comptes par défaut. Aucune commande SQL à exécuter manuellement.

---

## Comptes par défaut (créés automatiquement)

| Rôle | Courriel | Mot de passe |
|---|---|---|
| Admin | admin@collegelacite.ca | Admin123! |
| Conducteur | conducteur@collegelacite.ca | Admin123! |
| Passager | passager@collegelacite.ca | Admin123! |

---

## Structure du projet

```
covoiturage-back-end/
├── db/
│   ├── db.js          # Connexion et initialisation de la BD
│   ├── schema.sql     # Schéma SQL (référence)
│   └── database.sqlite
├── model/
│   ├── utilisateur.js
│   ├── trajet.js
│   ├── reservation.js
│   ├── admin.js
│   └── piece_identite.js
├── tests/
│   ├── unit/          # Tests unitaires (Vitest)
│   └── integration/   # Tests d'intégration
├── docs/
│   ├── doxygen/html/  # Documentation générée
│   └── tests/         # Stratégie de tests
├── auth.js
├── server.js
├── .env.example
└── package.json
```

---

## Scripts disponibles

```bash
npm start              # Démarrer le serveur
npm run dev            # Démarrer avec rechargement automatique (nodemon)
npm test               # Lancer les tests unitaires (Vitest)
npm run test:integration  # Lancer les tests d'intégration (serveur doit tourner)
```

---

## Base de données

Le schéma complet est disponible dans [db/schema.sql](db/schema.sql).

La base de données est initialisée automatiquement au premier démarrage avec :
- Les 4 tables : `utilisateur`, `trajet`, `reservation`, `piece_identite`
- 3 comptes par défaut (admin, conducteur, passager)

---

## Documentation Doxygen

Pour générer la documentation du code :

```bash
doxygen Doxyfile
```

Puis ouvrir :

```bash
start docs/doxygen/html/index.html
```

---

## Tests

```bash
# Tests unitaires (46 tests)
npm test

# Tests d'intégration (serveur doit être démarré)
npm run test:integration
```

Les scénarios de test sont documentés dans [docs/tests/README.md](docs/tests/README.md).
