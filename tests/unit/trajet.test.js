import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/db.js', () => ({
  db: {
    all: vi.fn(),
    get: vi.fn(),
    run: vi.fn(),
  },
}));

import { db } from '../../db/db.js';
import {
  getTrajet,
  getTrajetParId,
  addTrajet,
  updateTrajet,
  updateStatutTrajet,
  deleteTrajet,
  getTrajetsParUtilisateur,
  decrementerPlacesTrajet,
  incrementerPlacesTrajet,
} from '../../model/trajet.js';

describe('model/trajet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTrajet', () => {
    it('retourne tous les trajets', async () => {
      const mock = [{ id: 1, pointDeDepart: 'Ottawa', pointDarrivee: 'Gatineau' }];
      db.all.mockResolvedValue(mock);
      const result = await getTrajet();
      expect(result).toEqual(mock);
    });
  });

  describe('getTrajetParId', () => {
    it('retourne le trajet correspondant à l\'id', async () => {
      const mock = { id: 1, pointDeDepart: 'Ottawa' };
      db.get.mockResolvedValue(mock);
      const result = await getTrajetParId(1);
      expect(result).toEqual(mock);
    });

    it('retourne undefined si le trajet n\'existe pas', async () => {
      db.get.mockResolvedValue(undefined);
      const result = await getTrajetParId(99999);
      expect(result).toBeUndefined();
    });
  });

  describe('addTrajet', () => {
    it('ajoute un trajet et retourne son id', async () => {
      db.run.mockResolvedValue({ lastID: 42 });
      const result = await addTrajet('Ottawa', 'Gatineau', '2026-12-01T08:00', 3, 1);
      expect(result).toBe(42);
    });
  });

  describe('updateTrajet', () => {
    it('met à jour un trajet et retourne le nombre de lignes modifiées', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await updateTrajet(1, 'Ottawa', 'Montréal', '2026-12-01T08:00', 2);
      expect(result).toBe(1);
    });
  });

  describe('updateStatutTrajet', () => {
    it('met le statut ANNULE', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await updateStatutTrajet(1, 'ANNULE');
      expect(result).toBe(1);
    });

    it('met le statut TERMINE', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await updateStatutTrajet(1, 'TERMINE');
      expect(result).toBe(1);
    });

    it('retourne 0 si le trajet n\'existe pas', async () => {
      db.run.mockResolvedValue({ changes: 0 });
      const result = await updateStatutTrajet(99999, 'TERMINE');
      expect(result).toBe(0);
    });
  });

  describe('deleteTrajet', () => {
    it('supprime un trajet et retourne le nombre de lignes supprimées', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await deleteTrajet(1);
      expect(result).toBe(1);
    });
  });

  describe('getTrajetsParUtilisateur', () => {
    it('retourne les trajets d\'un conducteur', async () => {
      const mock = [{ id: 1, utilisateur_id: 2 }];
      db.all.mockResolvedValue(mock);
      const result = await getTrajetsParUtilisateur(2);
      expect(result).toEqual(mock);
    });
  });

  describe('decrementerPlacesTrajet', () => {
    it('décrémente les places disponibles', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await decrementerPlacesTrajet(1);
      expect(result).toBe(1);
    });

    it('retourne 0 si plus de places disponibles', async () => {
      db.run.mockResolvedValue({ changes: 0 });
      const result = await decrementerPlacesTrajet(1);
      expect(result).toBe(0);
    });
  });

  describe('incrementerPlacesTrajet', () => {
    it('incrémente les places disponibles', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await incrementerPlacesTrajet(1);
      expect(result).toBe(1);
    });
  });
});
