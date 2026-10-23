import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import MyMissionsPage from './MyMissionsPage';
import { getMyMissions } from '../api/missions';

vi.mock('../api/missions', () => ({
  getMyMissions: vi.fn(),
}));

const mockedGetMyMissions = vi.mocked(getMyMissions);

const missions = [
  {
    id: 1,
    title: 'Développement web',
    prospect: { name: 'Entreprise Alpha' },
    domain: 'INFORMATIQUE',
    status: 'EN_COURS',
    startDate: '2026-10-01T00:00:00.000Z',
    endDate: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 2,
    title: 'Conception électronique',
    prospect: { name: 'Entreprise Beta' },
    domain: 'MICROELECTRONIQUE',
    status: 'DEVIS',
    startDate: '2026-10-10T00:00:00.000Z',
    endDate: '2026-12-10T00:00:00.000Z',
  },
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('MyMissionsPage', () => {
  it('affiche les missions reçues de l’API', async () => {
    mockedGetMyMissions.mockResolvedValue(missions);

    render(<MyMissionsPage />);

    expect(
      await screen.findByText('Développement web'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('Conception électronique'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('2 mission(s)'),
    ).toBeInTheDocument();
  });

  it('filtre les missions par recherche', async () => {
    mockedGetMyMissions.mockResolvedValue(missions);

    render(<MyMissionsPage />);

    await screen.findByText('Développement web');

    fireEvent.change(
      screen.getByRole('textbox', {
        name: 'Rechercher une mission',
      }),
      { target: { value: 'Alpha' } },
    );

    expect(
      screen.getByText('Développement web'),
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Conception électronique'),
    ).not.toBeInTheDocument();
  });

  it('filtre les missions par domaine', async () => {
    mockedGetMyMissions.mockResolvedValue(missions);

    render(<MyMissionsPage />);

    await screen.findByText('Développement web');

    fireEvent.change(
      screen.getByRole('combobox', {
        name: 'Filtrer par domaine',
      }),
      { target: { value: 'MICROELECTRONIQUE' } },
    );

    expect(
      screen.getByText('Conception électronique'),
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Développement web'),
    ).not.toBeInTheDocument();
  });

  it('filtre les missions par statut', async () => {
    mockedGetMyMissions.mockResolvedValue(missions);

    render(<MyMissionsPage />);

    await screen.findByText('Développement web');

    fireEvent.change(
      screen.getByRole('combobox', {
        name: 'Filtrer par statut',
      }),
      { target: { value: 'EN_COURS' } },
    );

    expect(
      screen.getByText('Développement web'),
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Conception électronique'),
    ).not.toBeInTheDocument();
  });

  it('ne présente aucune colonne de prix', async () => {
    mockedGetMyMissions.mockResolvedValue(missions);

    render(<MyMissionsPage />);

    await screen.findByText('Développement web');

    const table = screen.getByRole('table');

    expect(
      within(table).queryByRole('columnheader', {
        name: /prix|montant/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('affiche un message lorsque la liste est vide', async () => {
    mockedGetMyMissions.mockResolvedValue([]);

    render(<MyMissionsPage />);

    expect(
      await screen.findByText('0 mission(s)'),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        'Aucune mission ne correspond à votre recherche.',
      ),
    ).toBeInTheDocument();
  });

  it('affiche une erreur si l’API échoue', async () => {
    mockedGetMyMissions.mockRejectedValue(
      new Error('Erreur réseau'),
    );

    render(<MyMissionsPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('alert'),
      ).toHaveTextContent('Erreur réseau');
    });
  });
});
