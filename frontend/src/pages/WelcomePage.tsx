import { Link } from 'react-router';
import { BriefcaseBusiness, UserRound } from 'lucide-react';

export default function WelcomePage() {
  return (
    <main className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">
          Junior-Entreprise
        </h1>

        <p className="auth-subtitle">
          Choisissez votre espace pour continuer.
        </p>

        <div className="card-grid">
          <Link
            to="/login/intervenant"
            className="card card-link role-card"
          >
            <UserRound className="role-icon" size={40} />

            <h2 className="card-title">Intervenant</h2>

            <p className="card-description">
              Consulter mon profil et mes missions
            </p>
          </Link>

          <Link
            to="/login/bureau"
            className="card card-link role-card"
          >
            <BriefcaseBusiness
              className="role-icon"
              size={40}
            />

            <h2 className="card-title">Bureau</h2>

            <p className="card-description">
              Gérer et suivre les activités de la Junior-Entreprise
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}