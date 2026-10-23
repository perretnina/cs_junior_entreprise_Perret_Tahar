
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from './client';
import {
  getMyMissions,
  getMissions,
  getMission,
  createMission,
  updateMission,
  deleteMission,
  type MissionInput,
} from './missions';

vi.mock('./client', () => ({
  apiRequest: vi.fn(),
}));

const mockedApiRequest = vi.mocked(apiRequest);

const missionInput: MissionInput = {
  title: 'Développement web',
  price: 1500,
  startDate: '2026-10-01',
  endDate: '2026-11-01',
  status: 'DEVIS',
  domain: 'INFORMATIQUE',
  prospectId: 1,
  intervenantIds: [2],
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('API Missions', () => {
  it('récupère les missions de l’Intervenant', async () => {
    await getMyMissions();

    expect(mockedApiRequest).toHaveBeenCalledWith(
      '/missions/mine',
    );
  });

  it('récupère toutes les missions du Bureau', async () => {
    await getMissions();

    expect(mockedApiRequest).toHaveBeenCalledWith(
      '/missions',
    );
  });

  it('récupère une mission par son identifiant', async () => {
    await getMission(5);

    expect(mockedApiRequest).toHaveBeenCalledWith(
      '/missions/5',
    );
  });

  it('crée une mission avec une requête POST', async () => {
    await createMission(missionInput);

    expect(mockedApiRequest).toHaveBeenCalledWith(
      '/missions',
      {
        method: 'POST',
        body: JSON.stringify(missionInput),
      },
    );
  });

  it('modifie une mission avec une requête PATCH', async () => {
    await updateMission(5, { status: 'EN_COURS' });

    expect(mockedApiRequest).toHaveBeenCalledWith(
      '/missions/5',
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'EN_COURS' }),
      },
    );
  });

  it('supprime une mission avec une requête DELETE', async () => {
    await deleteMission(5);

    expect(mockedApiRequest).toHaveBeenCalledWith(
      '/missions/5',
      {
        method: 'DELETE',
      },
    );
  });
});
