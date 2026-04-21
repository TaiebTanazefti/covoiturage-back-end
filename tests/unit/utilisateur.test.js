import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/db.js', () => ({
  db: {
    all: vi.fn(),
    get: vi.fn(),
    run: vi.fn(),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashedPassword'),
    compare: vi.fn(),
  },
}));

import { db } from '../../db/db.js';
import {
  getUtilisateur,
  getUtilisateurParId,
  getUtilisateurParCourriel,
  addUtilisateur,
  updateUtilisateur,
  updateRoleUtilisateur,
  deleteUtilisateur,
  validerUtilisateur,
  desactiverUtilisateur,
  reactiverUtilisateur,
  getAdminValideExiste,
  updateNoteUtilisateur,
} from '../../model/utilisateur.js';

describe('model/utilisateur', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUtilisateur', () => {
    it('retourne tous les utilisateurs', async () => {
      const mock = [{ id: 1, nom: 'Dupont' }];
      db.all.mockResolvedValue(mock);
      const result = await getUtilisateur();
      expect(result).toEqual(mock);
    });
  });

  describe('getUtilisateurParId', () => {
    it('retourne l\'utilisateur correspondant', async () => {
      const mock = { id: 1, nom: 'Dupont', courriel: 'test@test.com' };
      db.get.mockResolvedValue(mock);
      const result = await getUtilisateurParId(1);
      expect(result).toEqual(mock);
    });

    it('retourne undefined si l\'utilisateur n\'existe pas', async () => {
      db.get.mockResolvedValue(undefined);
      const result = await getUtilisateurParId(99999);
      expect(result).toBeUndefined();
    });
  });

  describe('getUtilisateurParCourriel', () => {
    it('retourne l\'utilisateur correspondant au courriel', async () => {
      const mock = { id: 1, courriel: 'test@test.com' };
      db.get.mockResolvedValue(mock);
      const result = await getUtilisateurParCourriel('test@test.com');
      expect(result).toEqual(mock);
    });

    it('retourne undefined si le courriel n\'existe pas', async () => {
      db.get.mockResolvedValue(undefined);
      const result = await getUtilisateurParCourriel('inexistant@test.com');
      expect(result).toBeUndefined();
    });
  });

  describe('addUtilisateur', () => {
    it('crée un utilisateur et retourne son id', async () => {
      db.run.mockResolvedValue({ lastID: 5 });
      const result = await addUtilisateur('test@test.com', 'password', 'Dupont', 'Jean', 'PASSAGER', 6135550000);
      expect(result).toBe(5);
    });
  });

  describe('updateUtilisateur', () => {
    it('met à jour un utilisateur', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await updateUtilisateur('Dupont', 'Jean', 'PASSAGER', 'test@test.com', 'hash', 1);
      expect(result).toBe(1);
    });
  });

  describe('updateRoleUtilisateur', () => {
    it('change le rôle en CONDUCTEUR', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await updateRoleUtilisateur(1, 'CONDUCTEUR');
      expect(result).toBe(1);
    });

    it('change le rôle en PASSAGER', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await updateRoleUtilisateur(1, 'PASSAGER');
      expect(result).toBe(1);
    });
  });

  describe('deleteUtilisateur', () => {
    it('supprime un utilisateur', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await deleteUtilisateur(1);
      expect(result).toBe(1);
    });
  });

  describe('validerUtilisateur', () => {
    it('valide le compte d\'un utilisateur', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await validerUtilisateur(1);
      expect(result).toBe(1);
    });
  });

  describe('desactiverUtilisateur', () => {
    it('désactive le compte d\'un utilisateur', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await desactiverUtilisateur(1);
      expect(result).toBe(1);
    });
  });

  describe('reactiverUtilisateur', () => {
    it('réactive le compte d\'un utilisateur', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await reactiverUtilisateur(1);
      expect(result).toBe(1);
    });
  });

  describe('getAdminValideExiste', () => {
    it('retourne true si un admin validé existe', async () => {
      db.get.mockResolvedValue({ 1: 1 });
      const result = await getAdminValideExiste();
      expect(result).toBe(true);
    });

    it('retourne false si aucun admin validé', async () => {
      db.get.mockResolvedValue(undefined);
      const result = await getAdminValideExiste();
      expect(result).toBe(false);
    });
  });

  describe('updateNoteUtilisateur', () => {
    it('met à jour la note d\'un utilisateur', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await updateNoteUtilisateur(1, 4.5, 2);
      expect(result).toBe(1);
    });
  });
});
