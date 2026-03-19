// Chargement du fichier de configuration
import 'dotenv/config'
console.log('DB_FILE =', process.env.DB_FILE);

// Importations générales du projet
import express, { json } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression';
import { addUtilisateur, getUtilisateur, getUtilisateurParId, getUtilisateurParCourriel, updateUtilisateur, updatePasswordUtilisateur, deleteUtilisateur, validerUtilisateur, desactiverUtilisateur, reactiverUtilisateur, updateRoleUtilisateur, getAdminValideExiste, updateNoteUtilisateur } from './model/utilisateur.js';
import { getReservation, addReservation, deleteReservation, getReservationsParUtilisateur, getReservationsParTrajet, getReservationParTrajetEtUtilisateur, getReservationParId, annulerReservation, accepterReservation, refuserReservation, updateStatutReservation, aEuTrajetCompleteAvec } from './model/reservation.js';
import { getTrajet, getTrajetFiltres, addTrajet, updateTrajet, deleteTrajet, getTrajetsParUtilisateur, getTrajetParId, decrementerPlacesTrajet, incrementerPlacesTrajet, updateStatutTrajet } from './model/trajet.js';
import { userAuth, adminAuth, conducteurAuth } from './auth.js';
import { addPieceIdentite, getPiecesParUtilisateur, getDernierePieceParUtilisateur } from './model/piece_identite.js';
import { getAdminStats } from './model/admin.js';
import bcrypt from 'bcrypt';
import session from 'express-session';
import MemoryStore from 'memorystore';
import passport from 'passport';

import './auth.js';
// Création du serveur
const app = express();

// Ajout des middlewares
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(json());
app.use(express.static('public'));

const MemoryStoreSession = MemoryStore(session);

const store = new MemoryStoreSession({
  checkPeriod: 3600000 });

app.use(
  session({
    cookie: { maxAge: 3600000 }, 
    name: 'covoiturage',
    store: store,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    secret: process.env.SESSION_SECRET
  })
);

// passport middlewares
app.use(passport.initialize());
app.use(passport.session());

// Programmation des routes
app.post('/api/utilisateur/inscription', async (req, res) => {
  try {
    const { courriel, password, nom, prenom, role, telephone } = req.body;
    const autoLogin = req.query.login === '1' || req.body.autoLogin === true;
    if (!courriel || !password || !nom || !prenom || !role || telephone === undefined) {
      return res.status(400).json({ message: 'Champs requis: courriel, password, nom, prenom, role, telephone' });
    }
    const id = await addUtilisateur(courriel, password, nom, prenom, role, telephone);
    if (role === 'ADMIN') {
      const adminValideExiste = await getAdminValideExiste();
      if (!adminValideExiste) {
        await validerUtilisateur(id);
      }
    }
    if (autoLogin) {
      const user = await getUtilisateurParId(id);
      if (!user) return res.status(201).json({ message: 'Compte créé' });
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: 'Erreur serveur' });
        res.status(201).json({ message: 'Compte créé' });
      });
      return;
    }
    res.status(201).json({ message: 'Compte créé' });
  } catch (err) {
    if (err.message?.includes('UNIQUE') || err.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ message: 'Courriel déjà utilisé' });
    }
    throw err;
  }
});

// Route bootstrap : valide le premier admin sans authentification (courriel + mot de passe requis)
app.post('/api/utilisateur/valider-premier-admin', async (req, res) => {
  const { courriel, password } = req.body;
  if (!courriel || !password) {
    return res.status(400).json({ message: 'courriel et password requis' });
  }
  const adminValideExiste = await getAdminValideExiste();
  if (adminValideExiste) {
    return res.status(403).json({ message: 'Un admin validé existe déjà' });
  }
  const utilisateur = await getUtilisateurParCourriel(courriel);
  if (!utilisateur) {
    return res.status(401).json({ message: 'Identifiants invalides' });
  }
  if (utilisateur.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Seul un admin peut être validé' });
  }
  if (utilisateur.valide === 1) {
    return res.status(200).json({ message: 'Compte déjà validé' });
  }
  const ok = await bcrypt.compare(password, utilisateur.password);
  if (!ok) {
    return res.status(401).json({ message: 'Identifiants invalides' });
  }
  await validerUtilisateur(utilisateur.id);
  res.status(200).json({ message: 'Admin validé, vous pouvez maintenant vous connecter' });
});

app.post('/api/utilisateur/login', (request, response, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      const code = info?.message;
      if (code === 'COMPTE_NON_VALIDE') {
        return response.status(401).json({ message: 'Votre compte doit être validé par un administrateur avant de pouvoir vous connecter.' });
      }
      if (code === 'COMPTE_DESACTIVE') {
        return response.status(401).json({ message: 'Votre compte a été désactivé. Contactez l\'administrateur.' });
      }
      return response.status(401).json({ message: 'Identifiants invalides' });
    }

    request.login(user, (err) => {
      if (err) {
        return next(err);
      }

      return response.status(200).json({
        id: user.id,
        courriel: user.courriel,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      });
    });
  })(request, response, next);
});

function noteMoyenne(u) {
  if (!u) return 0;
  const n = u.nbreDeNotes ?? 0;
  return n > 0 ? (u.note ?? 0) / n : (u.note ?? 0);
}

// Current user (protected)
app.get('/api/utilisateur/me', userAuth, (req, res) => {
  const u = req.user;
  res.status(200).json({
    id: u.id,
    courriel: u.courriel,
    nom: u.nom,
    prenom: u.prenom,
    role: u.role,
    telephone: u.telephone,
    note: noteMoyenne(u),
    nbreDeNotes: u.nbreDeNotes ?? 0,
    valide: u.valide,
    actif: u.actif
  });
});

// Logout
app.post('/api/utilisateur/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Erreur déconnexion' });
    req.session.destroy((err2) => {
      if (err2) return res.status(500).json({ message: 'Erreur déconnexion' });
      res.status(200).json({ message: 'Déconnecté' });
    });
  });
});

app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const stats = await getAdminStats();
    res.status(200).json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
});

app.get('/api/utilisateur', async (request, response) => {
    const utilisateurs = await getUtilisateur();
    response.status(200).json(utilisateurs);
});

// Admin: get latest ID piece for a user (must be before /api/utilisateur/:id)
app.get('/api/utilisateur/:id/piece-identite', adminAuth, async (req, res) => {
  const utilisateur_id = Number(req.params.id);
  if (!utilisateur_id) return res.status(400).json({ message: 'ID utilisateur invalide' });
  const piece = await getDernierePieceParUtilisateur(utilisateur_id);
  if (!piece) return res.status(404).json({ message: 'Aucune pièce d\'identité' });
  res.status(200).json({
    id: piece.id,
    utilisateur_id: piece.utilisateur_id,
    statut: piece.statut,
    date_soumission: piece.date_soumission,
    image_data: piece.image_data,
  });
});

// Get one user by id (no password) – for profile/driver display
app.get('/api/utilisateur/:id', async (req, res) => {
  const id = req.params.id;
  const user = await getUtilisateurParId(id);
  if (!user) {
    return res.status(404).json({ message: 'Utilisateur introuvable' });
  }
  res.status(200).json({
    id: user.id,
    courriel: user.courriel,
    nom: user.nom,
    prenom: user.prenom,
    role: user.role,
    telephone: user.telephone,
    note: noteMoyenne(user),
    nbreDeNotes: user.nbreDeNotes ?? 0,
    valide: user.valide,
    actif: user.actif
  });
});

app.patch('/api/utilisateur', async (request, response) => {
    const { id, nom, prenom, role, courriel, password } = request.body;
    if (!id) {
        return response.status(400).json({ message: 'id requis' });
    }
    const user = await getUtilisateurParId(id);
    if (!user) {
        return response.status(404).json({ message: 'Utilisateur introuvable' });
    }
    let newPassword = user.password;
    if (password) {
        newPassword = await bcrypt.hash(password, 10);
    }
    await updateUtilisateur(
        nom ?? user.nom,
        prenom ?? user.prenom,
        role ?? user.role,
        courriel ?? user.courriel,
        newPassword,
        id
    );
    response.status(200).end();
});


app.patch('/api/utilisateur/:id/valider', adminAuth, async (req, res) => {
  const id = req.params.id;

  const ok = await validerUtilisateur(id);
  if (ok === 0) {
    return res.status(404).json({ message: 'Utilisateur introuvable' });
  }

  res.status(200).json({ message: 'Compte validé' });
});

app.patch('/api/utilisateur/:id/desactiver', adminAuth, async (req, res) => {
  const id = req.params.id;

  const ok = await desactiverUtilisateur(id);
  if (ok === 0) {
    return res.status(404).json({ message: 'Utilisateur introuvable' });
  }

  res.status(200).json({ message: 'Compte désactivé' });
});

app.patch('/api/utilisateur/:id/reactiver', adminAuth, async (req, res) => {
  const id = req.params.id;

  const ok = await reactiverUtilisateur(id);
  if (ok === 0) {
    return res.status(404).json({ message: 'Utilisateur introuvable' });
  }

  res.status(200).json({ message: 'Compte réactivé' });
});
app.patch('/api/utilisateur/mode-conducteur', userAuth, async (req, res) => {
  if (req.user.role === 'ADMIN') {
    return res.status(200).json({ message: 'Les administrateurs conservent le rôle Admin' });
  }
  const id = req.user.id;
  const ok = await updateRoleUtilisateur(id, 'CONDUCTEUR');
  if (ok === 0) {
    return res.status(404).json({ message: 'Utilisateur introuvable' });
  }
  res.status(200).json({ message: 'Mode conducteur activé' });
});

app.patch('/api/utilisateur/mode-passager', userAuth, async (req, res) => {
  if (req.user.role === 'ADMIN') {
    return res.status(200).json({ message: 'Les administrateurs conservent le rôle Admin' });
  }
  const id = req.user.id;
  const ok = await updateRoleUtilisateur(id, 'PASSAGER');
  if (ok === 0) {
    return res.status(404).json({ message: 'Utilisateur introuvable' });
  }
  res.status(200).json({ message: 'Mode passager activé' });
});

app.delete('/api/utilisateur', async (request, response) => {
    const id = request.body?.id;
    if (!id) {
        return response.status(400).json({ message: 'id requis' });
    }
    await deleteUtilisateur(id);
    response.status(200).end();
});

// Rate a user (only after a completed trip together)
app.post('/api/utilisateur/:id/noter', userAuth, async (req, res) => {
  const targetId = Number(req.params.id);
  const { note } = req.body;
  const meId = req.user.id;

  if (!note || note < 1 || note > 5) {
    return res.status(400).json({ message: 'La note doit être entre 1 et 5' });
  }
  if (targetId === meId) {
    return res.status(400).json({ message: 'Vous ne pouvez pas vous noter vous-même' });
  }

  const target = await getUtilisateurParId(targetId);
  if (!target) {
    return res.status(404).json({ message: 'Utilisateur introuvable' });
  }

  const hadTrip = await aEuTrajetCompleteAvec(meId, targetId);
  if (!hadTrip) {
    return res.status(400).json({ message: 'Vous ne pouvez noter que après un trajet effectué ensemble' });
  }

  const currentSum = Number(target.note ?? 0);
  const currentCount = Number(target.nbreDeNotes ?? 0);
  const newSum = currentSum + note;
  const newCount = currentCount + 1;
  const newAvg = newSum / newCount;

  await updateNoteUtilisateur(targetId, newSum, newCount);
  res.status(200).json({ message: 'Merci pour votre évaluation', note: Math.round(newAvg * 10) / 10 });
});

// Pièce d'identité – user uploads image (base64 in body), requires auth (including valide=0 after signup)
app.post('/api/piece-identite', userAuth, async (req, res) => {
  const utilisateur_id = req.user.id;
  const image_data = req.body?.image || null;
  const id = await addPieceIdentite(utilisateur_id, image_data);
  res.status(201).json({ id });
});

app.get('/api/piece-identite/mes', userAuth, async (req, res) => {
  const list = await getPiecesParUtilisateur(req.user.id);
  res.status(200).json(list);
});

// Reservation

app.get('/api/reservation', async (request, response) => {
    const reservations = await getReservation();
    response.status(200).json(reservations);
});

// Get one reservation by id (with trip and user info); access: passenger, driver of trip, or admin
app.get('/api/reservation/:id', userAuth, async (req, res) => {
  const id = req.params.id;
  const reservation = await getReservationParId(id);
  if (!reservation) {
    return res.status(404).json({ message: 'Réservation introuvable' });
  }
  const trajet = await getTrajetParId(reservation.trajet_id);
  if (!trajet) {
    return res.status(404).json({ message: 'Trajet introuvable' });
  }
  const passenger = await getUtilisateurParId(reservation.utilisateur_id);
  const driver = await getUtilisateurParId(trajet.utilisateur_id);
  const me = req.user;
  const isPassenger = reservation.utilisateur_id === me.id;
  const isDriver = trajet.utilisateur_id === me.id;
  const isAdmin = me.role === 'ADMIN';
  if (!isPassenger && !isDriver && !isAdmin) {
    return res.status(403).json({ message: 'Accès interdit' });
  }
  const sanitizeUser = (u) => u ? { id: u.id, nom: u.nom, prenom: u.prenom, courriel: u.courriel, telephone: u.telephone, note: noteMoyenne(u) } : null;
  res.status(200).json({
    ...reservation,
    trajet,
    passager: sanitizeUser(passenger),
    conducteur: sanitizeUser(driver)
  });
});


app.get('/api/mes-reservations', userAuth, async (req, res) => {
  const utilisateur_id = req.user.id;
  const reservations = await getReservationsParUtilisateur(utilisateur_id);

  const withTrip = await Promise.all(reservations.map(async (r) => {
    const trajet = await getTrajetParId(r.trajet_id);
    const driver = trajet ? await getUtilisateurParId(trajet.utilisateur_id) : null;
    const sanitize = (u) => u ? { id: u.id, nom: u.nom, prenom: u.prenom, courriel: u.courriel } : null;
    return {
      ...r,
      trajet: trajet ? { ...trajet, conducteur: sanitize(driver) } : null
    };
  }));

  res.status(200).json(withTrip);
});
app.post('/api/reservation', userAuth, async (req, res) => {
  const { trajet_id } = req.body;

  if (!trajet_id) {
    return res.status(400).json({ message: 'trajet_id requis' });
  }

  const utilisateur_id = req.user.id;

  // 1) empêcher double réservation
  const deja = await getReservationParTrajetEtUtilisateur(trajet_id, utilisateur_id);
  if (deja) {
    return res.status(409).json({ message: 'Déjà réservé' });
  }

  // 2) vérifier que le trajet existe
  const trajet = await getTrajetParId(trajet_id);
  if (!trajet) {
    return res.status(404).json({ message: 'Trajet introuvable' });
  }

  // 3) vérifier statut + places
  if (trajet.statut !== 'ACTIF') {
    return res.status(400).json({ message: 'Trajet non disponible' });
  }

  if (trajet.nombreDePlacesDisponibles <= 0) {
    return res.status(400).json({ message: 'Aucune place disponible' });
  }

  // 4) diminuer les places (sécurisé)
  const changes = await decrementerPlacesTrajet(trajet_id);
  if (changes === 0) {
    return res.status(400).json({ message: 'Aucune place disponible' });
  }

  // 5) créer la réservation
  const id = await addReservation(trajet_id, utilisateur_id);

  res.status(201).json({ id });
});

app.delete('/api/reservation', userAuth, async (req, res) => {
  const id = req.body?.id;
  if (!id) {
    return res.status(400).json({ message: 'id requis' });
  }
  await deleteReservation(id);
  res.status(200).end();
});

app.delete('/api/reservation/:id', userAuth, async (req, res) => {
  const reservation_id = req.params.id;
  const utilisateur_id = req.user.id;

  // 1) vérifier réservation
  const reservation = await getReservationParId(reservation_id);
  if (!reservation) {
    return res.status(404).json({ message: 'Réservation introuvable' });
  }

  // 2) vérifier propriétaire
  if (reservation.utilisateur_id !== utilisateur_id) {
    return res.status(403).json({ message: 'Accès interdit' });
  }

  // 3) vérifier statut
  if (reservation.statut === 'ANNULEE') {
    return res.status(400).json({ message: 'Réservation déjà annulée' });
  }

  // 4) annuler la réservation
  const ok = await annulerReservation(reservation_id);
  if (ok === 0) {
    return res.status(400).json({ message: 'Impossible d’annuler' });
  }

  // 5) rendre la place au trajet
  await incrementerPlacesTrajet(reservation.trajet_id);

  res.status(200).json({ message: 'Réservation annulée' });
});

app.patch('/api/reservation/:id/accepter', userAuth, async (req, res) => {
  const reservation_id = req.params.id;
  const utilisateur_id = req.user.id; // conducteur connecté

  // 1) vérifier réservation
  const reservation = await getReservationParId(reservation_id);
  if (!reservation) {
    return res.status(404).json({ message: 'Réservation introuvable' });
  }

  // 2) réservation doit être EN_ATTENTE
  if (reservation.statut !== 'EN_ATTENTE') {
    return res.status(400).json({ message: 'Réservation non acceptables' });
  }

  // 3) vérifier trajet et propriétaire
  const trajet = await getTrajetParId(reservation.trajet_id);
  if (!trajet) {
    return res.status(404).json({ message: 'Trajet introuvable' });
  }

  // seul le conducteur (créateur du trajet) peut accepter
  if (trajet.utilisateur_id !== utilisateur_id) {
    return res.status(403).json({ message: 'Accès interdit' });
  }

  // 4) accepter
  const ok = await accepterReservation(reservation_id);
  if (ok === 0) {
    return res.status(400).json({ message: 'Impossible d’accepter' });
  }

  res.status(200).json({ message: 'Réservation acceptée' });
});

app.patch('/api/reservation/:id/refuser', userAuth, async (req, res) => {
  const reservation_id = req.params.id;
  const utilisateur_id = req.user.id; // conducteur connecté

  // 1) vérifier réservation
  const reservation = await getReservationParId(reservation_id);
  if (!reservation) {
    return res.status(404).json({ message: 'Réservation introuvable' });
  }

  // 2) réservation doit être EN_ATTENTE
  if (reservation.statut !== 'EN_ATTENTE') {
    return res.status(400).json({ message: 'Réservation non refusables' });
  }

  // 3) vérifier trajet et propriétaire
  const trajet = await getTrajetParId(reservation.trajet_id);
  if (!trajet) {
    return res.status(404).json({ message: 'Trajet introuvable' });
  }

  // seul le conducteur (créateur du trajet) peut refuser
  if (trajet.utilisateur_id !== utilisateur_id) {
    return res.status(403).json({ message: 'Accès interdit' });
  }

  // 4) refuser la réservation
  const ok = await refuserReservation(reservation_id);
  if (ok === 0) {
    return res.status(400).json({ message: 'Impossible de refuser' });
  }

  // 5) rendre la place au trajet (car une place avait été retirée à la réservation)
  await incrementerPlacesTrajet(reservation.trajet_id);

  res.status(200).json({ message: 'Réservation refusée' });
});

// Trajet



app.get('/api/trajet', async (request, response) => {
    const { pointDeDepart, pointDarrivee, date } = request.query;
    const trajets = (pointDeDepart || pointDarrivee || date)
      ? await getTrajetFiltres(pointDeDepart, pointDarrivee, date)
      : await getTrajet();
    response.status(200).json(trajets);
});

// Get one trip by id (with driver info)
app.get('/api/trajet/:id', async (req, res) => {
  const id = req.params.id;
  const trajet = await getTrajetParId(id);
  if (!trajet) {
    return res.status(404).json({ message: 'Trajet introuvable' });
  }
  const driver = await getUtilisateurParId(trajet.utilisateur_id);
  const sanitizeUser = (u) => u ? { id: u.id, nom: u.nom, prenom: u.prenom, courriel: u.courriel, telephone: u.telephone, note: noteMoyenne(u), nbreDeNotes: u.nbreDeNotes ?? 0 } : null;
  res.status(200).json({ ...trajet, conducteur: sanitizeUser(driver) });
});

// Get reservations for a trip (driver only)
app.get('/api/trajet/:id/reservations', userAuth, async (req, res) => {
  const id = req.params.id;
  const trajet = await getTrajetParId(id);
  if (!trajet) {
    return res.status(404).json({ message: 'Trajet introuvable' });
  }
  if (trajet.utilisateur_id !== req.user.id) {
    return res.status(403).json({ message: 'Accès interdit' });
  }
  const reservations = await getReservationsParTrajet(id);
  const withPassenger = await Promise.all(reservations.map(async (r) => {
    const passager = await getUtilisateurParId(r.utilisateur_id);
    const sanitize = (u) => u ? { id: u.id, nom: u.nom, prenom: u.prenom, courriel: u.courriel } : null;
    return { ...r, passager: sanitize(passager) };
  }));
  res.status(200).json(withPassenger);
});

app.post('/api/trajet', userAuth, conducteurAuth ,async (request, response) => {
  const { pointDeDepart, pointDarrivee, dateEtHeure, nombreDePlacesDisponibles } = request.body;

  if (!pointDeDepart || !pointDarrivee || !dateEtHeure || !nombreDePlacesDisponibles) {
    return response.status(400).json({ message: 'Champs manquants' });
  }

  // utilisateur connecté via session
  const utilisateur_id = request.user.id;

  const id = await addTrajet(
    pointDeDepart,
    pointDarrivee,
    dateEtHeure,
    nombreDePlacesDisponibles,
    utilisateur_id
  );

  response.status(201).json({ id });
});

app.patch('/api/trajet', userAuth, async (request, response) => {
    const { id, pointDeDepart, pointDarrivee, dateEtHeure, nombreDePlacesDisponibles } = request.body;
    if (!id) {
        return response.status(400).json({ message: 'id requis' });
    }
    const trajet = await getTrajetParId(id);
    if (!trajet) {
        return response.status(404).json({ message: 'Trajet introuvable' });
    }
    if (trajet.utilisateur_id !== request.user.id) {
        return response.status(403).json({ message: 'Accès interdit' });
    }
    await updateTrajet(id, pointDeDepart ?? trajet.pointDeDepart, pointDarrivee ?? trajet.pointDarrivee, dateEtHeure ?? trajet.dateEtHeure, nombreDePlacesDisponibles ?? trajet.nombreDePlacesDisponibles);
    response.status(200).end();
});

// Cancel trip (owner only): set statut ANNULE, release places for EN_ATTENTE/ACCEPTEE reservations
app.patch('/api/trajet/:id/annuler', userAuth, async (req, res) => {
  const id = req.params.id;
  const trajet = await getTrajetParId(id);
  if (!trajet) {
    return res.status(404).json({ message: 'Trajet introuvable' });
  }
  if (trajet.utilisateur_id !== req.user.id) {
    return res.status(403).json({ message: 'Accès interdit' });
  }
  if (trajet.statut === 'ANNULE') {
    return res.status(400).json({ message: 'Trajet déjà annulé' });
  }
  const reservations = await getReservationsParTrajet(id);
  for (const r of reservations) {
    if (r.statut === 'EN_ATTENTE' || r.statut === 'ACCEPTEE') {
      await incrementerPlacesTrajet(id);
      await updateStatutReservation(r.id, 'ANNULEE');
    }
  }
  await updateStatutTrajet(id, 'ANNULE');
  res.status(200).json({ message: 'Trajet annulé' });
});

app.delete('/api/trajet', userAuth, async (request, response) => {
    const id = request.body?.id ?? request.body?.idTrajet;
    if (!id) {
        return response.status(400).json({ message: 'id requis' });
    }
    const trajet = await getTrajetParId(id);
    if (!trajet) {
        return response.status(404).json({ message: 'Trajet introuvable' });
    }
    if (trajet.utilisateur_id !== request.user.id) {
        return response.status(403).json({ message: 'Accès interdit' });
    }
    const reservations = await getReservationsParTrajet(id);
    for (const r of reservations) {
      if (r.statut === 'EN_ATTENTE' || r.statut === 'ACCEPTEE') {
        await incrementerPlacesTrajet(id);
        await updateStatutReservation(r.id, 'ANNULEE');
      }
    }
    await updateStatutTrajet(id, 'ANNULE');
    await deleteTrajet(id);
    response.status(200).end();
});

app.get('/api/mes-trajets', userAuth, async (req, res) => {
  const utilisateur_id = req.user.id;

  const trajets = await getTrajetsParUtilisateur(utilisateur_id);

  res.status(200).json(trajets);
});
// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Erreur serveur' });
});

// Démarrage du serveur
app.listen(process.env.PORT);
console.log('Serveur démarré:');
console.log('http://localhost:' + process.env.PORT);