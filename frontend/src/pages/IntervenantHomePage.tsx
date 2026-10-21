
import { Link } from 'react-router';
import { BriefcaseBusiness, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function IntervenantHomePage() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">
            Espace Intervenant
          </h1>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <UserRound className="text-blue-600" />
            <h2 className="text-xl font-semibold">Mon profil</h2>
          </div>

          <p className="mt-4 text-slate-600">
            Email : {user?.email}
          </p>
        </section>

        <Link
          to="/intervenant/missions"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 transition hover:border-blue-400"
        >
          <BriefcaseBusiness className="text-blue-600" size={28} />

          <div>
            <h2 className="text-xl font-semibold">Mes missions</h2>
            <p className="text-slate-500">
              Consulter les missions qui me sont affectées
            </p>
          </div>
        </Link>
      </div>
    </main>
  );
}
