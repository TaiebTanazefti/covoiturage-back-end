import { db } from '../db/db.js';

/**
 * Stats for admin dashboard: users, trips, reservations, ratings, charts.
 */
export async function getAdminStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const iso30 = thirtyDaysAgo.toISOString().slice(0, 19);

  const users = await db.all(`SELECT id, valide, role, note, nbreDeNotes FROM utilisateur`);
  const totalUsers = users.length;
  const certifiedUsers = users.filter((u) => u.valide === 1).length;
  const pendingValidations = users.filter((u) => u.valide === 0 && u.role !== 'ADMIN').length;

  const withNotes = users.filter((u) => (u.nbreDeNotes ?? 0) > 0);
  const totalNoteSum = withNotes.reduce((s, u) => s + (u.note ?? 0), 0);
  const totalNoteCount = withNotes.reduce((s, u) => s + (u.nbreDeNotes ?? 0), 0);
  const avgRating = totalNoteCount > 0 ? Math.round((totalNoteSum / totalNoteCount) * 10) / 10 : null;

  const trips = await db.all(`SELECT id, dateEtHeure FROM trajet`);
  const tripsTotal = trips.length;
  const tripsLast30Days = trips.filter((t) => t.dateEtHeure >= iso30).length;

  const reservations = await db.all(`SELECT id, statut FROM reservation`);
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

  // Trips per week: last 6 weeks (Sem 1 = oldest, Sem 6 = most recent)
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
      tripsPerWeek[weekIndex].trajets++;
    }
  });

  // Recent activities: last 5 trips (by date) and optionally last validated users (we don't store validation date)
  const trajetsForActivity = await db.all(
    `SELECT t.id, t.pointDeDepart, t.pointDarrivee, t.dateEtHeure
     FROM trajet t ORDER BY t.dateEtHeure DESC LIMIT 5`
  );
  const recentActivities = trajetsForActivity.map((t, i) => ({
    id: `trip-${t.id}`,
    type: 'trip',
    message: `Trajet ${t.pointDeDepart} → ${t.pointDarrivee} (${formatDate(t.dateEtHeure)})`,
    time: formatTimeAgo(t.dateEtHeure),
    iconKey: 'Car',
  }));

  return {
    totalUsers,
    certifiedUsers,
    pendingValidations,
    avgRating,
    tripsTotal,
    tripsLast30Days,
    reservationsTotal,
    reservationsByStatus,
    tripsPerWeek,
    recentActivities,
    pendingReports: 0,
  };
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

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
