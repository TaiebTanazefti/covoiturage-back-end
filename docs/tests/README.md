# Stratégie de tests — Covoiturage Collège La Cité

## 1. Approche de test

Le projet utilise deux types de tests :

- **Tests unitaires** : vérifient chaque fonction des modèles de manière isolée (sans base de données réelle)
- **Tests d'intégration** : vérifient les routes API complètes avec le serveur en cours d'exécution

### Outils utilisés
- **Vitest** — framework de tests unitaires (ES modules compatible)
- **Node.js fetch** — appels HTTP pour les tests d'intégration

### Lancer les tests
```bash
# Tests unitaires
npm test

# Tests d'intégration (serveur doit être démarré)
npm run test:integration
```

---

## 2. Tests unitaires (`tests/unit/`)

### 2.1 `trajet.test.js`

| # | Scénario | Fonction testée | Résultat attendu |
|---|---|---|---|
| 1 | Retourner tous les trajets | `getTrajet()` | Retourne un tableau de trajets |
| 2 | Retourner un trajet par ID existant | `getTrajetParId(1)` | Retourne l'objet trajet |
| 3 | Retourner undefined pour ID inexistant | `getTrajetParId(99999)` | Retourne `undefined` |
| 4 | Ajouter un nouveau trajet | `addTrajet(...)` | Retourne l'ID du nouveau trajet |
| 5 | Mettre à jour un trajet | `updateTrajet(...)` | Retourne 1 (ligne modifiée) |
| 6 | Mettre le statut ANNULE | `updateStatutTrajet(1, 'ANNULE')` | Retourne 1 |
| 7 | Mettre le statut TERMINE | `updateStatutTrajet(1, 'TERMINE')` | Retourne 1 |
| 8 | Statut sur trajet inexistant | `updateStatutTrajet(99999, 'TERMINE')` | Retourne 0 |
| 9 | Supprimer un trajet | `deleteTrajet(1)` | Retourne 1 (ligne supprimée) |
| 10 | Trajets par conducteur | `getTrajetsParUtilisateur(2)` | Retourne tableau filtré |
| 11 | Décrémenter les places | `decrementerPlacesTrajet(1)` | Retourne 1 |
| 12 | Décrémenter sans places disponibles | `decrementerPlacesTrajet(1)` | Retourne 0 |
| 13 | Incrémenter les places | `incrementerPlacesTrajet(1)` | Retourne 1 |

### 2.2 `reservation.test.js`

| # | Scénario | Fonction testée | Résultat attendu |
|---|---|---|---|
| 1 | Retourner toutes les réservations | `getReservation()` | Retourne un tableau |
| 2 | Retourner une réservation par ID | `getReservationParId(1)` | Retourne l'objet réservation |
| 3 | ID inexistant | `getReservationParId(99999)` | Retourne `undefined` |
| 4 | Réservations par utilisateur | `getReservationsParUtilisateur(3)` | Retourne tableau filtré |
| 5 | Réservations par trajet | `getReservationsParTrajet(5)` | Retourne tableau filtré |
| 6 | Créer une réservation | `addReservation(1, 2)` | Retourne l'ID créé |
| 7 | Annuler une réservation active | `annulerReservation(1)` | Retourne 1 |
| 8 | Annuler une réservation déjà annulée | `annulerReservation(1)` | Retourne 0 |
| 9 | Accepter une réservation EN_ATTENTE | `accepterReservation(1)` | Retourne 1 |
| 10 | Accepter une réservation non EN_ATTENTE | `accepterReservation(1)` | Retourne 0 |
| 11 | Refuser une réservation | `refuserReservation(1)` | Retourne 1 |
| 12 | Mettre le statut TERMINEE | `updateStatutReservation(1, 'TERMINEE')` | Retourne 1 |
| 13 | Supprimer une réservation | `deleteReservation(1)` | Fonction appelée |
| 14 | Vérifier réservation existante | `getReservationParTrajetEtUtilisateur(2,3)` | Retourne la réservation |
| 15 | Aucune réservation active | `getReservationParTrajetEtUtilisateur(2,3)` | Retourne `undefined` |
| 16 | Trajet terminé ensemble — vrai | `aEuTrajetCompleteAvec(1, 2)` | Retourne `true` |
| 17 | Aucun trajet terminé ensemble | `aEuTrajetCompleteAvec(1, 2)` | Retourne `false` |

### 2.3 `utilisateur.test.js`

| # | Scénario | Fonction testée | Résultat attendu |
|---|---|---|---|
| 1 | Retourner tous les utilisateurs | `getUtilisateur()` | Retourne un tableau |
| 2 | Retourner un utilisateur par ID | `getUtilisateurParId(1)` | Retourne l'objet utilisateur |
| 3 | ID inexistant | `getUtilisateurParId(99999)` | Retourne `undefined` |
| 4 | Retourner par courriel existant | `getUtilisateurParCourriel(...)` | Retourne l'utilisateur |
| 5 | Courriel inexistant | `getUtilisateurParCourriel(...)` | Retourne `undefined` |
| 6 | Créer un utilisateur | `addUtilisateur(...)` | Retourne l'ID créé |
| 7 | Mettre à jour un utilisateur | `updateUtilisateur(...)` | Retourne 1 |
| 8 | Changer rôle en CONDUCTEUR | `updateRoleUtilisateur(1, 'CONDUCTEUR')` | Retourne 1 |
| 9 | Changer rôle en PASSAGER | `updateRoleUtilisateur(1, 'PASSAGER')` | Retourne 1 |
| 10 | Supprimer un utilisateur | `deleteUtilisateur(1)` | Retourne 1 |
| 11 | Valider un compte | `validerUtilisateur(1)` | Retourne 1 |
| 12 | Désactiver un compte | `desactiverUtilisateur(1)` | Retourne 1 |
| 13 | Réactiver un compte | `reactiverUtilisateur(1)` | Retourne 1 |
| 14 | Admin validé existe | `getAdminValideExiste()` | Retourne `true` |
| 15 | Aucun admin validé | `getAdminValideExiste()` | Retourne `false` |
| 16 | Mettre à jour la note | `updateNoteUtilisateur(1, 4.5, 2)` | Retourne 1 |

---

## 3. Tests d'intégration (`tests/integration/routes.test.js`)

| # | Scénario | Route | Résultat attendu |
|---|---|---|---|
| 1 | Login admin valide | POST /api/utilisateur/login | 200 + role ADMIN |
| 2 | Login conducteur valide | POST /api/utilisateur/login | 200 + role CONDUCTEUR |
| 3 | Login passager valide | POST /api/utilisateur/login | 200 + role PASSAGER |
| 4 | Login mauvais mot de passe | POST /api/utilisateur/login | 401 |
| 5 | Inscription valide | POST /api/utilisateur/inscription | 201 |
| 6 | Inscription champs manquants | POST /api/utilisateur/inscription | 400 |
| 7 | Inscription courriel dupliqué | POST /api/utilisateur/inscription | 409 |
| 8 | Lister tous les utilisateurs | GET /api/utilisateur | 200 + tableau |
| 9 | Utilisateur par ID existant | GET /api/utilisateur/:id | 200 |
| 10 | Utilisateur ID inexistant | GET /api/utilisateur/:id | 404 |
| 11 | Profil connecté | GET /api/utilisateur/me | 200 |
| 12 | Profil sans auth | GET /api/utilisateur/me | 401 |
| 13 | Lister tous les trajets | GET /api/trajet | 200 + tableau |
| 14 | Créer trajet (conducteur) | POST /api/trajet | 201 |
| 15 | Créer trajet sans auth | POST /api/trajet | 401 |
| 16 | Créer trajet champs manquants | POST /api/trajet | 400 |
| 17 | Trajet par ID existant | GET /api/trajet/:id | 200 |
| 18 | Trajet ID inexistant | GET /api/trajet/:id | 404 |
| 19 | Mes trajets (conducteur) | GET /api/mes-trajets | 200 |
| 20 | Mes trajets sans auth | GET /api/mes-trajets | 401 |
| 21 | Lister toutes les réservations | GET /api/reservation | 200 + tableau |
| 22 | Créer réservation (passager) | POST /api/reservation | 201 |
| 23 | Créer réservation sans auth | POST /api/reservation | 401 |
| 24 | Créer réservation sans trajet_id | POST /api/reservation | 400 |
| 25 | Double réservation | POST /api/reservation | 409 |
| 26 | Mes réservations (passager) | GET /api/mes-reservations | 200 |
| 27 | Mes réservations sans auth | GET /api/mes-reservations | 401 |
| 28 | Stats admin | GET /api/admin/stats | 200 |
| 29 | Stats admin sans auth | GET /api/admin/stats | 401/403 |
| 30 | Stats admin non-admin | GET /api/admin/stats | 401/403 |
| 31 | Valider utilisateur (admin) | PATCH /api/utilisateur/:id/valider | 200 |
| 32 | Désactiver utilisateur (admin) | PATCH /api/utilisateur/:id/desactiver | 200 |
| 33 | Réactiver utilisateur (admin) | PATCH /api/utilisateur/:id/reactiver | 200 |
| 34 | Déconnexion | POST /api/utilisateur/logout | 200 |

---

## 4. Résultats

- **Tests unitaires** : 46/46 ✅
- **Tests d'intégration** : 34 scénarios couvrant toutes les routes principales ✅
