import { db } from '../db/db.js';

/**
 * @function getAdminStats
 * @description Calcule et retourne les statistiques globales du tableau de bord administrateur.
 *              Inclut le nombre d'utilisateurs, les trajets, les réservations par statut,
 *              l'évolution des trajets sur 6 semaines et les activités récentes.
 * @returns {Promise<Object>} Un objet contenant toutes les statistiques du tableau de bord :
 *   - {number} totalUsers - Nombre total d'utilisateurs
 *   - {number} certifiedUsers - Nombre d'utilisateurs validés
 *   - {number} pendingValidations - Nombre de comptes en attente de validation
 *   - {number|null} avgRating - Note moyenne de tous les utilisateurs notés
 *   - {number} tripsTotal - Nombre total de trajets
 *   - {number} tripsLast30Days - Nombre de trajets des 30 derniers jours
 *   - {number} reservationsTotal - Nombre total de réservations
 *   - {Array} reservationsByStatus - Répartition des réservations par statut
 *   - {Array} tripsPerWeek - Nombre de trajets par semaine sur 6 semaines
 *   - {Array} recentActivities - Les 5 derniers trajets créés
 */
export async function getAdminStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const iso30 = thirtyDaysAgo.toISOString().slice(0, 19);

  const users = (await db.all(`SELECT id, valide, role, note, nbreDeNotes FROM utilisateur`)) ?? [];
  const totalUsers = users.length;
  const certifiedUsers = users.filter((u) => u.valide === 1).length;
  const pendingValidations = users.filter((u) => u.valide === 0 && u.role !== 'ADMIN').length;

  const withNotes = users.filter((u) => (u.nbreDeNotes ?? 0) > 0);
  const totalNoteSum = withNotes.reduce((s, u) => s + (u.note ?? 0), 0);
  const totalNoteCount = withNotes.reduce((s, u) => s + (u.nbreDeNotes ?? 0), 0);
  const avgRating = totalNoteCount > 0 ? Math.round((totalNoteSum / totalNoteCount) * 10) / 10 : null;

  const trips = (await db.all(`SELECT id, dateEtHeure FROM trajet`)) ?? [];
  const tripsTotal = trips.length;
  const tripsLast30Days = trips.filter((t) => t.dateEtHeure >= iso30).length;

  const reservations = (await db.all(`SELECT id, statut FROM reservation`)) ?? [];
  const reservationsTotal = reservations.length;
  const byStatus = { ACCEPTEE: 0, EN_ATTENTE: 0, REFUSEE: 0, ANNULEE: 0 };
  reservations.forEach((r) => {
    if (byStatus[r.statut] !== undefined) byStatus[r.statut]++;
  });
  const reservationsByStatus = [
    { name: 'Acceptées', value: byStatus.ACCEPTEE, color: '#10A85C' },
    { name: 'En attente', value: byStatus.EN_ATTENTE, color: '#F59E0B' },
    { name: 'Refusées', value: byStatus.REFUSEE, color: '#EF4444' },
    { name: 'Annulées', value: byStatus.ANNULEE, color: '#6B7280' },
  ];

  const tripsPerWeek = [];
  const sixWeeksAgo = new Date(now);
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
  const iso6w = sixWeeksAgo.toISOString().slice(0, 19);
  for (let i = 0; i < 6; i++) {
    tripsPerWeek.push({ week: `Sem ${i + 1}`, trajets: 0 });
  }
  trips.forEach((t) => {
    if (t.dateEtHeure >= iso6w) {
      const d = new Date(t.dateEtHeure);
      const daysAgo = Math.floor((now - d) / 86400000);
const weekIndex = 5 - Math.min(5, Math.floor(daysAgo / 7));
if (weekIndex >= 0 && weekIndex < 6) tripsPerWeek[weekIndex].trajets++;
    }
  });

  const trajetsForActivity = (await db.all(
    `SELECT t.id, t.pointDeDepart, t.pointDarrivee, t.dateEtHeure
     FROM trajet t ORDER BY t.dateEtHeure DESC LIMIT 5`
  )) ?? [];

  const recentActivities = trajetsForActivity.map((t) => ({
    id: `trip-${t.id}`,
    type: 'trip',
    message: `Trajet ${t.pointDeDepart} → ${t.pointDarrivee} (${formatDate(t.dateEtHeure)})`,
    time: formatTimeAgo(t.dateEtHeure),
    iconKey: 'Car',
  }));

  return {
    totalUsers, certifiedUsers, pendingValidations, avgRating,
    tripsTotal, tripsLast30Days, reservationsTotal,
    reservationsByStatus, tripsPerWeek, recentActivities, pendingReports: 0,
  };
}

/**
 * @function formatDate
 * @description Formate une date ISO en chaîne lisible en français canadien.
 * @param {string} iso - La date au format ISO 8601.
 * @returns {string} La date formatée (ex: "13 avr. 2026").
 */
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * @function formatTimeAgo
 * @description Retourne une chaîne relative indiquant depuis combien de temps un événement a eu lieu.
 *              Exemples : "Récent", "Il y a 3 h", "Il y a 2 j".
 * @param {string} iso - La date de l'événement au format ISO 8601.
 * @returns {string} Une chaîne de temps relatif lisible.
 */
function formatTimeAgo(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 60) return 'Récent';
  if (diffH < 24) return `Il y a ${diffH} h`;
  if (diffD < 7) return `Il y a ${diffD} j`;
  return formatDate(iso);
}