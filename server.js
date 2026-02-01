// Chargement du fichier de configuration
import 'dotenv/config'

// Importations générales du projet
import express, { json } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression';
import { getUtilisateur, addUtilisateur, updateUtilisateur, patchUtilisateur, deleteUtilisateur} from './model/utilisateur.js';
import { getReservation, addReservation, deleteReservation } from './model/reservation.js';
import { getTrajet, addTrajet, updateTrajet, deleteTrajet } from './model/trajet.js';
// Création du serveur
const app = express();

// Ajout des middlewares
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(json());
app.use(express.static('public'));

// Programmation des routes

app.get('/api/utilisateur', async (request, response) => {
    const utilisateurs = await getUtilisateur();
    response.status(200).json(utilisateurs);
});

app.post('/api/utilisateur', async (request, response) => {
    await addUtilisateur(request.body.courriel, request.body.password);
    response.status(201).end();
});


app.patch('/api/utilisateur', async (request, response) => {
    await patchUtilisateur(request.body.nom, request.body.prenom, request.body.role, request.body.courriel, request.body.password, request.body.id );
    response.status(200).end();
});

app.patch('/api/utilisateur', async (request, response) => {
    await updateUtilisateur(request.body.nom, request.body.prenom, request.body.role, request.body.courriel, request.body.password, request.body.id );
    response.status(200).end();
});

app.delete('/api/utilisateur', async (request, response) => {
    await deleteUtilisateur(request.body.id );
    response.status(200).end();
});

// Reservation

app.get('/api/reservation', async (request, response) => {
    const reservations = await getReservation();
    response.status(200).json(reservations);
});

app.post('/api/reservation', async (request, response) => {
    await addReservation(request.body.id, request.body.idTrajet);
    response.status(201).end();
});

app.delete('/api/reservation', async (request, response) => {
    await deleteReservation(request.body.idReservation );
    response.status(200).end();
});

// Trajet

app.get('/api/trajet', async (request, response) => {
    const trajets = await getTrajet();
    response.status(200).json(trajets);
});


app.post('/api/trajet', async (request, response) => {
    await addTrajet(request.body.pointDeDepart, request.body.pointDarrivee, request.body.dateEtHeure,  request.body.nombreDePlacesDisponibles);
    response.status(201).end();
});

app.patch('/api/trajet', async (request, response) => {
    await updateTrajet(request.body.pointDeDepart, request.body.pointDarrivee, request.body.dateEtHeure, request.body.nombreDePlacesDisponibles);
    response.status(200).end();
});


app.delete('/api/trajet', async (request, response) => {
    await deleteTrajet(request.body.idTrajet );
    response.status(200).end();
});
// Démarrage du serveur
app.listen(process.env.PORT);
console.log('Serveur démarré:');
console.log('http://localhost:' + process.env.PORT);