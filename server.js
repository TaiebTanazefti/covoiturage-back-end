// Chargement du fichier de configuration
import 'dotenv/config'

// Importations générales du projet
import express, { json } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression';
import { addUtilisateur, getUtilisateur, getUtilisateurParId, getUtilisateurParCourriel, updateUtilisateur, updatePasswordUtilisateur, deleteUtilisateur, validerUtilisateur, desactiverUtilisateur, reactiverUtilisateur, updateRoleUtilisateur, getAdminValideExiste } from './model/utilisateur.js';
import { getReservation, addReservation, deleteReservation,  getReservationsParUtilisateur, getReservationParTrajetEtUtilisateur, getReservationParId, annulerReservation, accepterReservation, refuserReservation } from './model/reservation.js';
import { getTrajet, addTrajet, updateTrajet, deleteTrajet, getTrajetsParUtilisateur, getTrajetParId, decrementerPlacesTrajet , incrementerPlacesTrajet } from './model/trajet.js';
import { userAuth, adminAuth, conducteurAuth } from './auth.js';
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
    if (!courriel || !password || !nom || !prenom || !role || telephone === undefined) {
      return res.status(400).json({ message: 'Champs requis: courriel, password, nom, prenom, role, telephone' });
    }
    const id = await addUtilisateur(courriel, password, nom, prenom, role, telephone);
    // Valider automatiquement le premier admin (évite le blocage bootstrap)
    if (role === 'ADMIN') {
      const adminValideExiste = await getAdminValideExiste();
      if (!adminValideExiste) {
        await validerUtilisateur(id);
      }
    }
    res.status(201).end();
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
  passport.authenticate('local', (err, user) => {
    if (err) {
      return next(err);
    }

    if (!user) {
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

app.get('/api/utilisateur', async (request, response) => {
    const utilisateurs = await getUtilisateur();
    response.status(200).json(utilisateurs);
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
  const id = req.user.id;

  const ok = await updateRoleUtilisateur(id, 'CONDUCTEUR');
  if (ok === 0) {
    return res.status(404).json({ message: 'Utilisateur introuvable' });
  }

  res.status(200).json({ message: 'Mode conducteur activé' });
});

app.patch('/api/utilisateur/mode-passager', userAuth, async (req, res) => {
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

// Reservation

app.get('/api/reservation', async (request, response) => {
    const reservations = await getReservation();
    response.status(200).json(reservations);
});


app.get('/api/mes-reservations', userAuth, async (req, res) => {
  const utilisateur_id = req.user.id;

  const reservations = await getReservationsParUtilisateur(utilisateur_id);

  res.status(200).json(reservations);
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
    const trajets = await getTrajet();
    response.status(200).json(trajets);
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

app.patch('/api/trajet', async (request, response) => {
    const { id, pointDeDepart, pointDarrivee, dateEtHeure, nombreDePlacesDisponibles } = request.body;
    if (!id) {
        return response.status(400).json({ message: 'id requis' });
    }
    await updateTrajet(id, pointDeDepart, pointDarrivee, dateEtHeure, nombreDePlacesDisponibles);
    response.status(200).end();
});


app.delete('/api/trajet', async (request, response) => {
    const id = request.body?.id ?? request.body?.idTrajet;
    if (!id) {
        return response.status(400).json({ message: 'id requis' });
    }
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