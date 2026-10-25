
import { Link, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export default function IntervenantLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/welcome', { replace: true });
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <Link to="/intervenant" className="header-logo-link">
            <img
              src="/images/logo-junior.png"
              alt="Logo de la Junior-Entreprise"
              className="header-logo"
            />
          </Link>

          <div>
            <h1 className="app-title">
              <Link to="/intervenant">Junior Entreprise Castelmont</Link>
            </h1>

            <p className="app-tagline">
              Espace Intervenant
            </p>
          </div>
        </div>

        <nav className="app-nav">
          <Link to="/intervenant">
            Accueil
          </Link>

          <Link to="/intervenant/missions">
            Mes missions
          </Link>

          <button
            type="button"
            className="link-button"
            onClick={handleLogout}
          >
            Déconnexion
          </button>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
