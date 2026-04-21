import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';

import { getUtilisateurParCourriel, getUtilisateurParId } from './model/utilisateur.js';

/**
 * @file auth.js
 * @description Configuration de l'authentification avec Passport.js.
 *              Gère la stratégie locale (courriel + mot de passe),
 *              la sérialisation/désérialisation de session,
 *              et les middlewares de protection des routes.
 */

/**
 * @description Configuration de la stratégie d'authentification locale avec Passport.
 *              Vérifie le courriel, le mot de passe, ainsi que le statut du compte
 *              (validé et actif) avant d'autoriser la connexion.
 */
passport.use(
  new LocalStrategy(
    { usernameField: 'courriel', passwordField: 'password' },
    async (courriel, password, done) => {
      try {
        const utilisateur = await getUtilisateurParCourriel(courriel);

        if (!utilisateur) {
          return done(null, false);
        }

        const ok = await bcrypt.compare(password, utilisateur.password);
        if (!ok) {
          return done(null, false);
        }

        if (utilisateur.valide === 0) {
          return done(null, false, { message: 'COMPTE_NON_VALIDE' });
        }

        if (utilisateur.actif === 0) {
          return done(null, false, { message: 'COMPTE_DESACTIVE' });
        }

        return done(null, utilisateur);
      } catch (e) {
        return done(e);
      }
    }
  )
);

/**
 * @function serializeUser
 * @description Sérialise l'utilisateur en session en sauvegardant uniquement son identifiant.
 *              Appelée automatiquement par Passport après une connexion réussie.
 * @param {Object} utilisateur - L'objet utilisateur authentifié.
 * @param {function} done - Callback Passport.
 */
passport.serializeUser((utilisateur, done) => {
  done(null, utilisateur.id);
});

/**
 * @function deserializeUser
 * @description Désérialise l'utilisateur depuis la session en récupérant ses données complètes.
 *              Appelée automatiquement par Passport à chaque requête authentifiée.
 * @param {number} id - L'identifiant de l'utilisateur stocké en session.
 * @param {function} done - Callback Passport.
 */
passport.deserializeUser(async (id, done) => {
  try {
    const utilisateur = await getUtilisateurParId(id);
    done(null, utilisateur);
  } catch (e) {
    done(e);
  }
});

/**
 * @function userAuth
 * @description Middleware de protection des routes réservées aux utilisateurs connectés.
 *              Retourne une erreur 401 si l'utilisateur n'est pas authentifié.
 * @param {Object} req - L'objet requête Express.
 * @param {Object} res - L'objet réponse Express.
 * @param {function} next - La fonction suivante dans la chaîne de middlewares.
 */
export function userAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).end();
}

/**
 * @function adminAuth
 * @description Middleware de protection des routes réservées aux administrateurs.
 *              Retourne une erreur 403 si l'utilisateur n'est pas connecté ou n'est pas ADMIN.
 * @param {Object} req - L'objet requête Express.
 * @param {Object} res - L'objet réponse Express.
 * @param {function} next - La fonction suivante dans la chaîne de middlewares.
 */
export function adminAuth(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'ADMIN') {
    return next();
  }
  res.status(403).end();
}

/**
 * @function conducteurAuth
 * @description Middleware de protection des routes réservées aux conducteurs.
 *              Retourne une erreur 403 si l'utilisateur n'est pas connecté ou n'est pas CONDUCTEUR.
 * @param {Object} req - L'objet requête Express.
 * @param {Object} res - L'objet réponse Express.
 * @param {function} next - La fonction suivante dans la chaîne de middlewares.
 */
export function conducteurAuth(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'CONDUCTEUR') {
    return next();
  }
  res.status(403).json({ message: 'Mode conducteur requis' });
}