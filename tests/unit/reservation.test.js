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
  getReservation,
  getReservationParId,
  getReservationsParUtilisateur,
  getReservationsParTrajet,
  addReservation,
  annulerReservation,
  accepterReservation,
  refuserReservation,
  updateStatutReservation,
  deleteReservation,
  getReservationParTrajetEtUtilisateur,
  aEuTrajetCompleteAvec,
} from '../../model/reservation.js';

describe('model/reservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReservation', () => {
    it('retourne toutes les réservations', async () => {
      const mock = [{ id: 1, statut: 'EN_ATTENTE' }];
      db.all.mockResolvedValue(mock);
      const result = await getReservation();
      expect(result).toEqual(mock);
    });
  });

  describe('getReservationParId', () => {
    it('retourne la réservation correspondante', async () => {
      const mock = { id: 1, statut: 'EN_ATTENTE', trajet_id: 2 };
      db.get.mockResolvedValue(mock);
      const result = await getReservationParId(1);
      expect(result).toEqual(mock);
    });

    it('retourne undefined si la réservation n\'existe pas', async () => {
      db.get.mockResolvedValue(undefined);
      const result = await getReservationParId(99999);
      expect(result).toBeUndefined();
    });
  });

  describe('getReservationsParUtilisateur', () => {
    it('retourne les réservations d\'un utilisateur', async () => {
      const mock = [{ id: 1, utilisateur_id: 3 }];
      db.all.mockResolvedValue(mock);
      const result = await getReservationsParUtilisateur(3);
      expect(result).toEqual(mock);
    });
  });

  describe('getReservationsParTrajet', () => {
    it('retourne les réservations d\'un trajet', async () => {
      const mock = [{ id: 1, trajet_id: 5 }];
      db.all.mockResolvedValue(mock);
      const result = await getReservationsParTrajet(5);
      expect(result).toEqual(mock);
    });
  });

  describe('addReservation', () => {
    it('crée une réservation et retourne son id', async () => {
      db.run.mockResolvedValue({ lastID: 10 });
      const result = await addReservation(1, 2);
      expect(result).toBe(10);
    });
  });

  describe('annulerReservation', () => {
    it('annule une réservation active', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await annulerReservation(1);
      expect(result).toBe(1);
    });

    it('retourne 0 si déjà annulée', async () => {
      db.run.mockResolvedValue({ changes: 0 });
      const result = await annulerReservation(1);
      expect(result).toBe(0);
    });
  });

  describe('accepterReservation', () => {
    it('accepte une réservation EN_ATTENTE', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await accepterReservation(1);
      expect(result).toBe(1);
    });

    it('retourne 0 si la réservation n\'est pas EN_ATTENTE', async () => {
      db.run.mockResolvedValue({ changes: 0 });
      const result = await accepterReservation(1);
      expect(result).toBe(0);
    });
  });

  describe('refuserReservation', () => {
    it('refuse une réservation EN_ATTENTE', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await refuserReservation(1);
      expect(result).toBe(1);
    });
  });

  describe('updateStatutReservation', () => {
    it('met le statut TERMINEE', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      const result = await updateStatutReservation(1, 'TERMINEE');
      expect(result).toBe(1);
    });
  });

  describe('deleteReservation', () => {
    it('supprime une réservation', async () => {
      db.run.mockResolvedValue({ changes: 1 });
      await deleteReservation(1);
      expect(db.run).toHaveBeenCalled();
    });
  });

  describe('getReservationParTrajetEtUtilisateur', () => {
    it('retourne la réservation existante', async () => {
      const mock = { id: 1, trajet_id: 2, utilisateur_id: 3 };
      db.get.mockResolvedValue(mock);
      const result = await getReservationParTrajetEtUtilisateur(2, 3);
      expect(result).toEqual(mock);
    });

    it('retourne undefined si aucune réservation active', async () => {
      db.get.mockResolvedValue(undefined);
      const result = await getReservationParTrajetEtUtilisateur(2, 3);
      expect(result).toBeUndefined();
    });
  });

  describe('aEuTrajetCompleteAvec', () => {
    it('retourne true si un trajet terminé existe entre les deux utilisateurs', async () => {
      db.get.mockResolvedValue({ 1: 1 });
      const result = await aEuTrajetCompleteAvec(1, 2);
      expect(result).toBe(true);
    });

    it('retourne false si aucun trajet terminé ensemble', async () => {
      db.get.mockResolvedValue(undefined);
      const result = await aEuTrajetCompleteAvec(1, 2);
      expect(result).toBe(false);
    });
  });
});
