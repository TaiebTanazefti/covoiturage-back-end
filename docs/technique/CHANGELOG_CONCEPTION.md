# Journal des changements de conception
## Sprint 2 — Mars 2026

### Ajouts
- Table notifications ajoutée (type, message, est_lu)
- Champ places_restantes ajouté à la table trajet
- Statut réservation étendu : en_attente, acceptee, refusee, annulee
- Routes : modifier trajet, annuler trajet, accepter/refuser réservation
- Nouvelles pages frontend : BookingsPage, SearchResultsPage, NotificationsPage

### Modifications
- Gestion atomique des réservations (transaction SQL)
- Middleware de rôles renforcé (passager/conducteur/admin)
