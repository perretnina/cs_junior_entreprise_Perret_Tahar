import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  BriefcaseBusiness,
  Building2,
  Users,
  Wallet,
} from 'lucide-react';

import KpiCard from '../components/KpiCard';
import { getMissions, type Mission } from '../api/missions';
import { getKpi } from '../api/kpi';

type DashboardData = {
  totalMissions: number;
  totalProspects: number;
  signedRevenue: number;
  totalIntervenants: number;
  recentMissions: Mission[];
};

const statusLabels: Record<string, string> = {
  DEVIS: 'Devis',
  SIGNE: 'Signée',
  FACTURE_ACOMPTE_EMISE: 'Facture acompte émise',
  FACTURE_ACOMPTE_PAYEE: 'Acompte payé',
  EN_COURS: 'En cours',
  FACTURE_SOLDE_EMISE: 'Facture solde émise',
  FACTURE_SOLDE_PAYEE: 'Solde payé',
  TERMINEE: 'Terminée',
};

function getStatusStyle(status: string) {
  if (status === 'TERMINEE' || status === 'FACTURE_SOLDE_PAYEE') {
    return 'bg-green-100 text-green-800';
  }

  if (status === 'EN_COURS') {
    return 'bg-blue-100 text-blue-800';
  }

  if (status === 'DEVIS') {
    return 'bg-amber-100 text-amber-800';
  }

  return 'bg-slate-100 text-slate-700';
}

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [missions, kpi] = await Promise.all([
          getMissions(),
          getKpi(new Date().getFullYear()),
        ]);

        if (!active) return;

        setData({
          totalMissions: kpi.totalMissions,
          totalProspects: kpi.contactedProspects,
          signedRevenue: kpi.signedRevenue,
          totalIntervenants: kpi.distinctIntervenants,
          recentMissions: [...missions]
            .filter((mission) => mission.startDate.startsWith('2026'))
            .sort((a, b) => b.startDate.localeCompare(a.startDate))
            .slice(0, 5),
        });
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de charger le tableau de bord.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <div className="page-heading">
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble de la Junior-Entreprise</p>
      </div>

      {error && (
        <p role="alert" style={{ color: '#b91c1c', marginBottom: 20 }}>
          {error}
        </p>
      )}

      {loading ? (
        <p>Chargement du tableau de bord...</p>
      ) : data ? (
        <>
          <div className="card-grid">
            <KpiCard
              title="Missions"
              value={String(data.totalMissions)}
              icon={BriefcaseBusiness}
              to="/missions"
            />

            <KpiCard
              title="Prospects"
              value={String(data.totalProspects)}
              icon={Building2}
              to="/prospects"
            />

            <KpiCard
              title={`CA signé ${new Date().getFullYear()}`}
              value={currencyFormatter.format(data.signedRevenue)}
              icon={Wallet}
              to="/kpi"
            />

            <KpiCard
              title="Intervenants"
              value={String(data.totalIntervenants)}
              icon={Users}
              to="/intervenants"
            />
          </div>

          <section className="section">
            <h2 className="section-title">
              Missions récentes
            </h2>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mission</th>
                    <th>Client</th>
                    <th>Statut</th>
                  </tr>
                </thead>

                <tbody>
                  {data.recentMissions.length === 0 ? (
                    <tr>
                      <td colSpan={3}>
                        Aucune mission enregistrée.
                      </td>
                    </tr>
                  ) : (
                    data.recentMissions.map((mission) => (
                      <tr key={mission.id}>
                        <td>
                          <Link
                            to="/missions"
                            style={{
                              color: 'inherit',
                              textDecoration: 'none',
                              fontWeight: 500,
                            }}
                          >
                            {mission.title}
                          </Link>
                        </td>

                        <td>{mission.prospect.name}</td>

                        <td>
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(mission.status)}`}
                          >
                            {statusLabels[mission.status] ??
                              mission.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}