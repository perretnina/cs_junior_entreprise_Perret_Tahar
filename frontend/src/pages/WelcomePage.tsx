
import { Link } from 'react-router';
import { BriefcaseBusiness, UserRound } from 'lucide-react';

export default function WelcomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          Junior-Entreprise
        </h1>

        <p className="mt-3 text-slate-500">
          Choisissez votre espace pour continuer.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Link
            to="/login/intervenant"
            className="flex flex-col items-center rounded-2xl bg-white p-10 shadow-sm transition hover:shadow-lg"
          >
            <UserRound size={44} className="text-blue-600" />
            <h2 className="mt-5 text-xl font-semibold">
              Intervenant
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Consulter mon profil et mes missions
            </p>
          </Link>

          <Link
            to="/login/bureau"
            className="flex flex-col items-center rounded-2xl bg-white p-10 shadow-sm transition hover:shadow-lg"
          >
            <BriefcaseBusiness size={44} className="text-blue-600" />
            <h2 className="mt-5 text-xl font-semibold">
              Bureau
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Gérez et suivez l'activité de la Junior-Entreprise
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
