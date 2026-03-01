import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';

import { getUtilisateurParCourriel, getUtilisateurParId } from './model/utilisateur.js';

// 1) Stratégie locale (login)
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

passport.serializeUser((utilisateur, done) => {
  done(null, utilisateur.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const utilisateur = await getUtilisateurParId(id);
    done(null, utilisateur);
  } catch (e) {
    done(e);
  }
});

export function userAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).end();
}

export function adminAuth(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'ADMIN') {
    return next();
  }
  res.status(403).end();
}

export function conducteurAuth(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'CONDUCTEUR') {
    return next();
  }
  res.status(403).json({ message: 'Mode conducteur requis' });
}