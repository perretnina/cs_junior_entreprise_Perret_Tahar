
import { Link } from 'react-router';
import {
  BriefcaseBusiness,
  UserRound,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function IntervenantHomePage() {
  const { user } = useAuth();

  return (
    <>
      <div className="page-heading">
        <h1>Mon espace</h1>
        <p>
          Retrouvez vos informations et vos missions.
        </p>
      </div>

      <div className="card-grid">
        <section className="card">
          <UserRound
            className="kpi-icon"
            size={28}
          />

          <h2 className="card-title">
            Mon profil
          </h2>

          <div className="profile-info">
            <p>
              <strong>Nom :</strong> {user?.lastName ?? '—'}
            </p>
            <p>
              <strong>Prénom :</strong> {user?.firstName ?? '—'}
            </p>
            <p>
              <strong>Email :</strong> {user?.email}
            </p>
          </div>
        </section>

        <Link
          to="/intervenant/missions"
          className="card card-link flex flex-col items-center justify-center text-center"
        >
          <BriefcaseBusiness
            className="kpi-icon"
            size={28}
          />

          <h2 className="card-title">
            Mes missions
          </h2>

          <p className="card-description">
            Consulter les missions qui me sont affectées
          </p>
        </Link>
      </div>
    </>
  );
}
