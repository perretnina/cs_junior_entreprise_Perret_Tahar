import { Link, NavLink } from 'react-router';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="header-brand">
        <Link to="/" className="header-logo-link">
          <img
            src="/images/logo-junior.png"
            alt="Logo de la Junior-Entreprise"
            className="header-logo"
          />
        </Link>

        <div>
          <h1 className="app-title">
            <Link to="/">Junior Entreprise Castelmont</Link>
          </h1>

          <p className="app-tagline">
            Gestion et suivi des activités
          </p>
        </div>
      </div>

      <nav className="app-nav" aria-label="Navigation principale">
        <NavLink to="/" end>
          Tableau de bord
        </NavLink>

        <NavLink to="/missions">Missions</NavLink>
        <NavLink to="/prospects">Prospects</NavLink>
        <NavLink to="/intervenants">Intervenants</NavLink>
        <NavLink to="/kpi">KPI</NavLink>

        {user && (
          <>
            <span className="app-user">{user.email}</span>

            <button
              type="button"
              className="link-button"
              onClick={logout}
            >
              Déconnexion
            </button>
          </>
        )}
      </nav>
    </header>
  );
}