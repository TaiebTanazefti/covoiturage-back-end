/**
 * Script de test des routes API
 * Usage: node test-routes.js
 * Le serveur doit être démarré sur le PORT configuré dans .env
 */

import 'dotenv/config';

const BASE = `http://localhost:${process.env.PORT || 3000}`;

let cookiesAdmin = '';
let cookiesConducteur = '';
let cookiesPassager = '';
let trajetId = null;
let reservationId = null;

let passed = 0;
let failed = 0;

// ─── Utilitaires ─────────────────────────────────────────────────────────────

async function fetchApi(method, path, body = null, cookies = '') {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookies ? { Cookie: cookies } : {}),
    },
  };
  if (body !== null && ['POST', 'PATCH', 'DELETE'].includes(method)) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, opts);
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  const setCookie = res.headers.get('set-cookie') || '';
  return { status: res.status, data, setCookie };
}

function ok(label) {
  console.log(`  ✓ ${label}`);
  passed++;
}

function fail(label, info = '') {
  console.log(`  ✗ ${label}${info ? ' → ' + JSON.stringify(info) : ''}`);
  failed++;
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

async function runTests() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║       Tests des routes API           ║');
  console.log('╚══════════════════════════════════════╝');

  // ── 1. LOGIN ─────────────────────────────────────────────────────────────
  section('1. Authentification');

  try {
    const email = process.env.ADMIN_DEFAULT_EMAIL || 'admin@collegelacite.ca';
    const password = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin123!';
    const r = await fetchApi('POST', '/api/utilisateur/login', { courriel: email, password });
    if (r.status === 200 && r.data?.role === 'ADMIN') {
      cookiesAdmin = r.setCookie;
      ok('POST /api/utilisateur/login (admin valide)');
    } else fail('POST /api/utilisateur/login (admin)', r.data);
  } catch (e) { fail('POST /api/utilisateur/login (admin)', e.message); }

  try {
    const email = process.env.CONDUCTEUR_DEFAULT_EMAIL || 'conducteur@collegelacite.ca';
    const password = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin123!';
    const r = await fetchApi('POST', '/api/utilisateur/login', { courriel: email, password });
    if (r.status === 200 && r.data?.role === 'CONDUCTEUR') {
      cookiesConducteur = r.setCookie;
      ok('POST /api/utilisateur/login (conducteur valide)');
    } else fail('POST /api/utilisateur/login (conducteur)', r.data);
  } catch (e) { fail('POST /api/utilisateur/login (conducteur)', e.message); }

  try {
    const email = process.env.PASSAGER_DEFAULT_EMAIL || 'passager@collegelacite.ca';
    const password = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin123!';
    const r = await fetchApi('POST', '/api/utilisateur/login', { courriel: email, password });
    if (r.status === 200 && r.data?.role === 'PASSAGER') {
      cookiesPassager = r.setCookie;
      ok('POST /api/utilisateur/login (passager valide)');
    } else fail('POST /api/utilisateur/login (passager)', r.data);
  } catch (e) { fail('POST /api/utilisateur/login (passager)', e.message); }

  try {
    const r = await fetchApi('POST', '/api/utilisateur/login', {
      courriel: 'admin@collegelacite.ca',
      password: 'mauvaisMotDePasse',
    });
    if (r.status === 401) ok('POST /api/utilisateur/login (mauvais mdp → 401)');
    else fail('POST /api/utilisateur/login (mauvais mdp)', r.data);
  } catch (e) { fail('POST /api/utilisateur/login (mauvais mdp)', e.message); }

  // ── 2. INSCRIPTION ───────────────────────────────────────────────────────
  section('2. Inscription');

  try {
    const r = await fetchApi('POST', '/api/utilisateur/inscription', {
      courriel: `test${Date.now()}@test.com`,
      password: 'Test123!',
      nom: 'Testeur',
      prenom: 'Auto',
      role: 'PASSAGER',
      telephone: 6135550099,
    });
    if (r.status === 201) ok('POST /api/utilisateur/inscription (valide)');
    else fail('POST /api/utilisateur/inscription (valide)', r.data);
  } catch (e) { fail('POST /api/utilisateur/inscription (valide)', e.message); }

  try {
    const r = await fetchApi('POST', '/api/utilisateur/inscription', { courriel: 'x@x.com' });
    if (r.status === 400) ok('POST /api/utilisateur/inscription (champs manquants → 400)');
    else fail('POST /api/utilisateur/inscription (champs manquants)', r.data);
  } catch (e) { fail('POST /api/utilisateur/inscription (champs manquants)', e.message); }

  try {
    const r = await fetchApi('POST', '/api/utilisateur/inscription', {
      courriel: 'admin@collegelacite.ca',
      password: 'Test123!',
      nom: 'Dup',
      prenom: 'Dup',
      role: 'PASSAGER',
      telephone: 6135550000,
    });
    if (r.status === 409) ok('POST /api/utilisateur/inscription (courriel dupliqué → 409)');
    else fail('POST /api/utilisateur/inscription (courriel dupliqué)', r.data);
  } catch (e) { fail('POST /api/utilisateur/inscription (courriel dupliqué)', e.message); }

  // ── 3. UTILISATEURS ──────────────────────────────────────────────────────
  section('3. Utilisateurs');

  try {
    const r = await fetchApi('GET', '/api/utilisateur');
    if (r.status === 200 && Array.isArray(r.data)) ok('GET /api/utilisateur');
    else fail('GET /api/utilisateur', r.data);
  } catch (e) { fail('GET /api/utilisateur', e.message); }

  try {
    const r = await fetchApi('GET', '/api/utilisateur/1');
    if (r.status === 200 && r.data?.id) ok('GET /api/utilisateur/:id (existant)');
    else fail('GET /api/utilisateur/:id (existant)', r.data);
  } catch (e) { fail('GET /api/utilisateur/:id', e.message); }

  try {
    const r = await fetchApi('GET', '/api/utilisateur/99999');
    if (r.status === 404) ok('GET /api/utilisateur/:id (inexistant → 404)');
    else fail('GET /api/utilisateur/:id (inexistant)', r.data);
  } catch (e) { fail('GET /api/utilisateur/:id (inexistant)', e.message); }

  try {
    const r = await fetchApi('GET', '/api/utilisateur/me', null, cookiesAdmin);
    if (r.status === 200 && r.data?.role === 'ADMIN') ok('GET /api/utilisateur/me (authentifié)');
    else fail('GET /api/utilisateur/me (authentifié)', r.data);
  } catch (e) { fail('GET /api/utilisateur/me (authentifié)', e.message); }

  try {
    const r = await fetchApi('GET', '/api/utilisateur/me');
    if (r.status === 401) ok('GET /api/utilisateur/me (sans auth → 401)');
    else fail('GET /api/utilisateur/me (sans auth)', r.data);
  } catch (e) { fail('GET /api/utilisateur/me (sans auth)', e.message); }

  try {
    const r = await fetchApi('PATCH', '/api/utilisateur', { nom: 'Test' });
    if (r.status === 400) ok('PATCH /api/utilisateur (sans id → 400)');
    else fail('PATCH /api/utilisateur (sans id)', r.data);
  } catch (e) { fail('PATCH /api/utilisateur (sans id)', e.message); }

  // ── 4. TRAJETS ───────────────────────────────────────────────────────────
  section('4. Trajets');

  try {
    const r = await fetchApi('GET', '/api/trajet');
    if (r.status === 200 && Array.isArray(r.data)) ok('GET /api/trajet');
    else fail('GET /api/trajet', r.data);
  } catch (e) { fail('GET /api/trajet', e.message); }

  try {
    const r = await fetchApi('POST', '/api/trajet', {
      pointDeDepart: 'Ottawa',
      pointDarrivee: 'Gatineau',
      dateEtHeure: new Date(Date.now() - 86400000).toISOString().slice(0, 19),
      nombreDePlacesDisponibles: 3,
    }, cookiesConducteur);
    if (r.status === 201 && r.data?.id) {
      trajetId = r.data.id;
      ok('POST /api/trajet (conducteur authentifié)');
    } else fail('POST /api/trajet (conducteur)', r.data);
  } catch (e) { fail('POST /api/trajet (conducteur)', e.message); }

  try {
    const r = await fetchApi('POST', '/api/trajet', {
      pointDeDepart: 'Ottawa',
      pointDarrivee: 'Gatineau',
      dateEtHeure: '2026-12-01T08:00:00',
      nombreDePlacesDisponibles: 3,
    });
    if (r.status === 401) ok('POST /api/trajet (sans auth → 401)');
    else fail('POST /api/trajet (sans auth)', r.data);
  } catch (e) { fail('POST /api/trajet (sans auth)', e.message); }

  try {
    const r = await fetchApi('POST', '/api/trajet', { pointDeDepart: 'Ottawa' }, cookiesConducteur);
    if (r.status === 400) ok('POST /api/trajet (champs manquants → 400)');
    else fail('POST /api/trajet (champs manquants)', r.data);
  } catch (e) { fail('POST /api/trajet (champs manquants)', e.message); }

  if (trajetId) {
    try {
      const r = await fetchApi('GET', `/api/trajet/${trajetId}`);
      if (r.status === 200 && r.data?.id === trajetId) ok('GET /api/trajet/:id (existant)');
      else fail('GET /api/trajet/:id (existant)', r.data);
    } catch (e) { fail('GET /api/trajet/:id', e.message); }
  }

  try {
    const r = await fetchApi('GET', '/api/trajet/99999');
    if (r.status === 404) ok('GET /api/trajet/:id (inexistant → 404)');
    else fail('GET /api/trajet/:id (inexistant)', r.data);
  } catch (e) { fail('GET /api/trajet/:id (inexistant)', e.message); }

  try {
    const r = await fetchApi('PATCH', '/api/trajet', { pointDeDepart: 'Montreal' }, cookiesConducteur);
    if (r.status === 400) ok('PATCH /api/trajet (sans id → 400)');
    else fail('PATCH /api/trajet (sans id)', r.data);
  } catch (e) { fail('PATCH /api/trajet (sans id)', e.message); }

  try {
    const r = await fetchApi('GET', '/api/mes-trajets', null, cookiesConducteur);
    if (r.status === 200 && Array.isArray(r.data)) ok('GET /api/mes-trajets (authentifié)');
    else fail('GET /api/mes-trajets (authentifié)', r.data);
  } catch (e) { fail('GET /api/mes-trajets (authentifié)', e.message); }

  try {
    const r = await fetchApi('GET', '/api/mes-trajets');
    if (r.status === 401) ok('GET /api/mes-trajets (sans auth → 401)');
    else fail('GET /api/mes-trajets (sans auth)', r.data);
  } catch (e) { fail('GET /api/mes-trajets (sans auth)', e.message); }

  // ── 5. RÉSERVATIONS ──────────────────────────────────────────────────────
  section('5. Réservations');

  try {
    const r = await fetchApi('GET', '/api/reservation');
    if (r.status === 200 && Array.isArray(r.data)) ok('GET /api/reservation');
    else fail('GET /api/reservation', r.data);
  } catch (e) { fail('GET /api/reservation', e.message); }

  if (trajetId) {
    try {
      const r = await fetchApi('POST', '/api/reservation', { trajet_id: trajetId }, cookiesPassager);
      if (r.status === 201 && r.data?.id) {
        reservationId = r.data.id;
        ok('POST /api/reservation (passager authentifié)');
      } else fail('POST /api/reservation (passager)', r.data);
    } catch (e) { fail('POST /api/reservation (passager)', e.message); }
  }

  try {
    const r = await fetchApi('POST', '/api/reservation', { trajet_id: 1 });
    if (r.status === 401) ok('POST /api/reservation (sans auth → 401)');
    else fail('POST /api/reservation (sans auth)', r.data);
  } catch (e) { fail('POST /api/reservation (sans auth)', e.message); }

  try {
    const r = await fetchApi('POST', '/api/reservation', {}, cookiesPassager);
    if (r.status === 400) ok('POST /api/reservation (sans trajet_id → 400)');
    else fail('POST /api/reservation (sans trajet_id)', r.data);
  } catch (e) { fail('POST /api/reservation (sans trajet_id)', e.message); }

  if (trajetId) {
    try {
      const r = await fetchApi('POST', '/api/reservation', { trajet_id: trajetId }, cookiesPassager);
      if (r.status === 409) ok('POST /api/reservation (double réservation → 409)');
      else fail('POST /api/reservation (double réservation)', r.data);
    } catch (e) { fail('POST /api/reservation (double réservation)', e.message); }
  }

  try {
    const r = await fetchApi('GET', '/api/mes-reservations', null, cookiesPassager);
    if (r.status === 200 && Array.isArray(r.data)) ok('GET /api/mes-reservations (authentifié)');
    else fail('GET /api/mes-reservations (authentifié)', r.data);
  } catch (e) { fail('GET /api/mes-reservations (authentifié)', e.message); }

  try {
    const r = await fetchApi('GET', '/api/mes-reservations');
    if (r.status === 401) ok('GET /api/mes-reservations (sans auth → 401)');
    else fail('GET /api/mes-reservations (sans auth)', r.data);
  } catch (e) { fail('GET /api/mes-reservations (sans auth)', e.message); }

  // ── 6. ADMIN ─────────────────────────────────────────────────────────────
  section('6. Routes Admin');

  try {
    const r = await fetchApi('GET', '/api/admin/stats', null, cookiesAdmin);
    if (r.status === 200 && r.data?.totalUsers !== undefined) ok('GET /api/admin/stats (admin authentifié)');
    else fail('GET /api/admin/stats (admin)', r.data);
  } catch (e) { fail('GET /api/admin/stats (admin)', e.message); }

  try {
    const r = await fetchApi('GET', '/api/admin/stats');
    if (r.status === 401 || r.status === 403) ok('GET /api/admin/stats (sans auth → 401/403)');
    else fail('GET /api/admin/stats (sans auth)', r.data);
  } catch (e) { fail('GET /api/admin/stats (sans auth)', e.message); }

  try {
    const r = await fetchApi('GET', '/api/admin/stats', null, cookiesPassager);
    if (r.status === 401 || r.status === 403) ok('GET /api/admin/stats (non-admin → 401/403)');
    else fail('GET /api/admin/stats (non-admin)', r.data);
  } catch (e) { fail('GET /api/admin/stats (non-admin)', e.message); }

  try {
    const users = await fetchApi('GET', '/api/utilisateur');
    const nonValide = users.data?.find(u => u.valide === 0);
    if (nonValide) {
      const r = await fetchApi('PATCH', `/api/utilisateur/${nonValide.id}/valider`, null, cookiesAdmin);
      if (r.status === 200) ok('PATCH /api/utilisateur/:id/valider (admin)');
      else fail('PATCH /api/utilisateur/:id/valider (admin)', r.data);
    } else {
      console.log('  ○ PATCH /api/utilisateur/:id/valider (skip: aucun utilisateur non validé)');
    }
  } catch (e) { fail('PATCH /api/utilisateur/:id/valider', e.message); }

  try {
    const r = await fetchApi('PATCH', '/api/utilisateur/2/desactiver', null, cookiesAdmin);
    if (r.status === 200 || r.status === 404) ok('PATCH /api/utilisateur/:id/desactiver (admin)');
    else fail('PATCH /api/utilisateur/:id/desactiver (admin)', r.data);
  } catch (e) { fail('PATCH /api/utilisateur/:id/desactiver', e.message); }

  try {
    const r = await fetchApi('PATCH', '/api/utilisateur/2/reactiver', null, cookiesAdmin);
    if (r.status === 200 || r.status === 404) ok('PATCH /api/utilisateur/:id/reactiver (admin)');
    else fail('PATCH /api/utilisateur/:id/reactiver (admin)', r.data);
  } catch (e) { fail('PATCH /api/utilisateur/:id/reactiver', e.message); }

  // ── 7. LOGOUT ────────────────────────────────────────────────────────────
  section('7. Déconnexion');

  try {
    const r = await fetchApi('POST', '/api/utilisateur/logout', null, cookiesAdmin);
    if (r.status === 200) ok('POST /api/utilisateur/logout (admin)');
    else fail('POST /api/utilisateur/logout', r.data);
  } catch (e) { fail('POST /api/utilisateur/logout', e.message); }

  // ── RÉSULTAT ─────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════╗');
  console.log(`║  ✓ Réussis : ${String(passed).padEnd(24)}║`);
  console.log(`║  ✗ Échoués : ${String(failed).padEnd(24)}║`);
  console.log(`║  Total     : ${String(passed + failed).padEnd(24)}║`);
  console.log('╚══════════════════════════════════════╝\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error('Erreur fatale:', e);
  process.exit(1);
});