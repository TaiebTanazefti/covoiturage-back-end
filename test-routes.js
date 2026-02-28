/**
 * Script de test des routes API
 * Usage: node test-routes.js
 * Le serveur doit être démarré sur le PORT configuré dans .env
 */

import 'dotenv/config';

const BASE = `http://localhost:${process.env.PORT || 3000}`;
let cookies = '';

async function fetchApi(method, path, body = null, useCredentials = false) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: useCredentials ? 'include' : 'omit',
  };
  if (body !== null && (method === 'POST' || method === 'PATCH' || method === 'DELETE')) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, opts);
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('=== Test des routes API ===\n');
  let passed = 0;
  let failed = 0;

  // 1. Inscription
  try {
    const r1 = await fetchApi('POST', '/api/utilisateur/inscription', {
      courriel: `test${Date.now()}@test.com`,
      password: 'Test123!',
      nom: 'Test',
      prenom: 'User',
      role: 'PASSAGER',
      telephone: 1234567890,
    });
    if (r1.status === 201) {
      console.log('✓ POST /api/utilisateur/inscription');
      passed++;
    } else {
      console.log('✗ POST /api/utilisateur/inscription:', r1.status, r1.data);
      failed++;
    }
  } catch (e) {
    console.log('✗ POST /api/utilisateur/inscription:', e.message);
    failed++;
  }

  // 2. Inscription - validation champs manquants
  try {
    const r2 = await fetchApi('POST', '/api/utilisateur/inscription', {});
    if (r2.status === 400) {
      console.log('✓ POST /api/utilisateur/inscription (validation)');
      passed++;
    } else {
      console.log('✗ POST /api/utilisateur/inscription (validation):', r2.status);
      failed++;
    }
  } catch (e) {
    console.log('✗ POST /api/utilisateur/inscription (validation):', e.message);
    failed++;
  }

  // 3. GET utilisateurs
  try {
    const r3 = await fetchApi('GET', '/api/utilisateur');
    if (r3.status === 200 && Array.isArray(r3.data)) {
      console.log('✓ GET /api/utilisateur');
      passed++;
    } else {
      console.log('✗ GET /api/utilisateur:', r3.status);
      failed++;
    }
  } catch (e) {
    console.log('✗ GET /api/utilisateur:', e.message);
    failed++;
  }

  // 4. GET trajets
  try {
    const r4 = await fetchApi('GET', '/api/trajet');
    if (r4.status === 200 && Array.isArray(r4.data)) {
      console.log('✓ GET /api/trajet');
      passed++;
    } else {
      console.log('✗ GET /api/trajet:', r4.status);
      failed++;
    }
  } catch (e) {
    console.log('✗ GET /api/trajet:', e.message);
    failed++;
  }

  // 5. GET reservations
  try {
    const r5 = await fetchApi('GET', '/api/reservation');
    if (r5.status === 200 && Array.isArray(r5.data)) {
      console.log('✓ GET /api/reservation');
      passed++;
    } else {
      console.log('✗ GET /api/reservation:', r5.status);
      failed++;
    }
  } catch (e) {
    console.log('✗ GET /api/reservation:', e.message);
    failed++;
  }

  // 6. Login (nécessite un utilisateur validé)
  try {
    const users = await fetchApi('GET', '/api/utilisateur');
    const validUser = users.data?.find((u) => u.valide === 1);
    if (validUser) {
      const r6 = await fetchApi('POST', '/api/utilisateur/login', {
        courriel: validUser.courriel,
        password: 'Test123!', // peut échouer si mot de passe différent
      });
      if (r6.status === 200) {
        console.log('✓ POST /api/utilisateur/login');
        passed++;
      } else {
        console.log('✗ POST /api/utilisateur/login:', r6.status, r6.data);
        failed++;
      }
    } else {
      console.log('○ POST /api/utilisateur/login (skip: aucun utilisateur validé)');
    }
  } catch (e) {
    console.log('✗ POST /api/utilisateur/login:', e.message);
    failed++;
  }

  // 7. PATCH utilisateur sans id
  try {
    const r7 = await fetchApi('PATCH', '/api/utilisateur', { nom: 'Test' });
    if (r7.status === 400) {
      console.log('✓ PATCH /api/utilisateur (validation id)');
      passed++;
    } else {
      console.log('✗ PATCH /api/utilisateur (validation):', r7.status);
      failed++;
    }
  } catch (e) {
    console.log('✗ PATCH /api/utilisateur:', e.message);
    failed++;
  }

  // 8. PATCH trajet sans id
  try {
    const r8 = await fetchApi('PATCH', '/api/trajet', { pointDeDepart: 'Paris' });
    if (r8.status === 400) {
      console.log('✓ PATCH /api/trajet (validation id)');
      passed++;
    } else {
      console.log('✗ PATCH /api/trajet (validation):', r8.status);
      failed++;
    }
  } catch (e) {
    console.log('✗ PATCH /api/trajet:', e.message);
    failed++;
  }

  // 9. DELETE trajet sans id (envoi body pour DELETE)
  try {
    const r9 = await fetchApi('DELETE', '/api/trajet', {});
    if (r9.status === 400) {
      console.log('✓ DELETE /api/trajet (validation id)');
      passed++;
    } else {
      console.log('✗ DELETE /api/trajet (validation):', r9.status);
      failed++;
    }
  } catch (e) {
    console.log('✗ DELETE /api/trajet:', e.message);
    failed++;
  }

  // 10. Routes protégées sans auth
  try {
    const r10 = await fetchApi('GET', '/api/mes-reservations');
    if (r10.status === 401) {
      console.log('✓ GET /api/mes-reservations (auth requise)');
      passed++;
    } else {
      console.log('✗ GET /api/mes-reservations:', r10.status);
      failed++;
    }
  } catch (e) {
    console.log('✗ GET /api/mes-reservations:', e.message);
    failed++;
  }

  try {
    const r11 = await fetchApi('GET', '/api/mes-trajets');
    if (r11.status === 401) {
      console.log('✓ GET /api/mes-trajets (auth requise)');
      passed++;
    } else {
      console.log('✗ GET /api/mes-trajets:', r11.status);
      failed++;
    }
  } catch (e) {
    console.log('✗ GET /api/mes-trajets:', e.message);
    failed++;
  }

  console.log('\n=== Résultat ===');
  console.log(`Réussis: ${passed}, Échoués: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error('Erreur:', e);
  process.exit(1);
});
