
import {
  BriefcaseBusiness,
  Building2,
  Users,
  Wallet,
} from 'lucide-react';

import KpiCard from '../components/KpiCard';

const missions = [
  {
    id: 1,
    title: 'Développement web',
    client: 'Entreprise Alpha',
    status: 'En cours',
  },
  {
    id: 2,
    title: 'Analyse de données',
    client: 'Entreprise Beta',
    status: 'Terminée',
  },
  {
    id: 3,
    title: 'Application mobile',
    client: 'Entreprise Gamma',
    status: 'À venir',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Tableau de bord
        </h1>
        <p className="mt-2 text-slate-500">
          Vue d'ensemble de la Junior-Entreprise
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Missions" value="12" icon={BriefcaseBusiness} />
        <KpiCard title="Prospects" value="28" icon={Building2} />
        <KpiCard title="Chiffre d'affaires" value="42 500 €" icon={Wallet} />
        <KpiCard title="Intervenants" value="34" icon={Users} />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Missions récentes
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-sm text-slate-500">
              <tr>
                <th className="px-6 py-4">Mission</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Statut</th>
              </tr>
            </thead>

            <tbody>
              {missions.map((mission) => (
                <tr key={mission.id} className="border-t border-slate-100">
                  <td className="px-6 py-4 font-medium">
                    {mission.title}
                  </td>
                  <td className="px-6 py-4">{mission.client}</td>
                  <td className="px-6 py-4">{mission.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
