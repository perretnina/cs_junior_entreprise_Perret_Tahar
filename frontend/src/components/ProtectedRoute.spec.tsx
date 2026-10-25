import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

type ActiveSpace = 'bureau' | 'intervenant';

type TestUser = {
  id: number;
  email: string;
  isBureau: boolean;
  isIntervenant: boolean;
  intervenantId: number | null;
};

const bureau: TestUser = {
  id: 1,
  email: 'bureau@test.fr',
  isBureau: true,
  isIntervenant: false,
  intervenantId: null,
};

const intervenant: TestUser = {
  id: 2,
  email: 'intervenant@test.fr',
  isBureau: false,
  isIntervenant: true,
  intervenantId: 2,
};

const compteMixte: TestUser = {
  id: 3,
  email: 'mixte@test.fr',
  isBureau: true,
  isIntervenant: true,
  intervenantId: 3,
};

function mockAuth(
  user: TestUser | null,
  activeSpace: ActiveSpace | null = null,
  loading = false,
) {
  mockedUseAuth.mockReturnValue({
    user,
    loading,
    login: vi.fn(),
    logout: vi.fn(),
    activeSpace,
    setActiveSpace: vi.fn(),
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
          path="/"
          element={<p>Espace Bureau</p>}
        />

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
    mockAuth(intervenant, 'intervenant');

    renderProtectedRoute(true);

    expect(
      screen.getByText('Espace Intervenant'),
    ).toBeInTheDocument();
  });

  it('autorise un membre du Bureau', () => {
    mockAuth(bureau, 'bureau');

    renderProtectedRoute(true);

    expect(
      screen.getByText('Page protégée'),
    ).toBeInTheDocument();
  });

  it('affiche le chargement de la session', () => {
    mockAuth(null, null, true);

    renderProtectedRoute();

    expect(
      screen.getByText('Chargement...'),
    ).toBeInTheDocument();
  });

  it('autorise un compte mixte connecté dans l’espace Bureau', () => {
    mockAuth(compteMixte, 'bureau');

    renderProtectedRoute(true);

    expect(
      screen.getByText('Page protégée'),
    ).toBeInTheDocument();
  });

  it('interdit l’espace Bureau à un compte mixte connecté comme Intervenant', () => {
    mockAuth(compteMixte, 'intervenant');

    renderProtectedRoute(true);

    expect(
      screen.getByText('Espace Intervenant'),
    ).toBeInTheDocument();
  });

  it('autorise un compte mixte connecté dans l’espace Intervenant', () => {
    mockAuth(compteMixte, 'intervenant');

    renderProtectedRoute();

    expect(
      screen.getByText('Page protégée'),
    ).toBeInTheDocument();
  });

  it('interdit l’espace Intervenant à un compte mixte connecté comme Bureau', () => {
    mockAuth(compteMixte, 'bureau');

    renderProtectedRoute();

    expect(
      screen.getByText('Espace Bureau'),
    ).toBeInTheDocument();
  });
});