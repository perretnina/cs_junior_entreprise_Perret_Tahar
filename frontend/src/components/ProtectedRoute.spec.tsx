import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

const bureau = {
  id: 1,
  email: 'bureau@test.fr',
  isBureau: true,
  isIntervenant: false,
  intervenantId: null,
};

const intervenant = {
  id: 2,
  email: 'intervenant@test.fr',
  isBureau: false,
  isIntervenant: true,
  intervenantId: 2,
};

function mockAuth(
  user: {
    id: number;
    email: string;
    isBureau: boolean;
    isIntervenant: boolean;
    intervenantId: number | null;
  } | null,
  loading = false,
) {
  mockedUseAuth.mockReturnValue({
    user,
    loading,
    login: vi.fn(),
    logout: vi.fn(),
  });
}

function renderProtectedRoute(bureauOnly = false) {
  return render(
    <MemoryRouter initialEntries={['/missions']}>
      <Routes>
        <Route
          element={<ProtectedRoute bureauOnly={bureauOnly} />}
        >
          <Route
            path="/missions"
            element={<p>Page protégée</p>}
          />
        </Route>

        <Route
          path="/welcome"
          element={<p>Page de bienvenue</p>}
        />

        <Route
          path="/intervenant"
          element={<p>Espace Intervenant</p>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ProtectedRoute', () => {
  it('redirige un utilisateur non connecté', () => {
    mockAuth(null);

    renderProtectedRoute();

    expect(
      screen.getByText('Page de bienvenue'),
    ).toBeInTheDocument();
  });

  it('interdit l’accès Bureau à un Intervenant', () => {
    mockAuth(intervenant);

    renderProtectedRoute(true);

    expect(
      screen.getByText('Espace Intervenant'),
    ).toBeInTheDocument();
  });

  it('autorise un membre du Bureau', () => {
    mockAuth(bureau);

    renderProtectedRoute(true);

    expect(
      screen.getByText('Page protégée'),
    ).toBeInTheDocument();
  });

  it('affiche le chargement de la session', () => {
    mockAuth(null, true);

    renderProtectedRoute();

    expect(
      screen.getByText('Chargement...'),
    ).toBeInTheDocument();
  });
});
