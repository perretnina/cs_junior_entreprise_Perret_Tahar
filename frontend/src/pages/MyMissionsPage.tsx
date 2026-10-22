
import { useEffect, useMemo, useState } from 'react';
import { Check, RefreshCw, Search, X } from 'lucide-react';

import {
  getMyMissions,
  type MyMission,
} from '../api/missions';

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

const domainLabels: Record<string, string> = {
  INFORMATIQUE: 'Informatique',
  MICROELECTRONIQUE: 'Microélectronique',
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    timeZone: 'UTC',
  });
}

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

export default function MyMissionsPage() {
  const [missions, setMissions] = useState<MyMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

  const [selectedMission, setSelectedMission] =
    useState<MyMission | null>(null);

  const [refreshed, setRefreshed] = useState(false);

  async function loadMissions() {
    setLoading(true);
    setError('');
    setRefreshed(false);

    try {
      const data = await getMyMissions();
      setMissions(data);
      setRefreshed(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger les missions.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMissions();
  }, []);

  useEffect(() => {
    if (!refreshed) return;

    const timeout = window.setTimeout(() => {
      setRefreshed(false);
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [refreshed]);

  const filteredMissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return missions.filter((mission) => {
      const matchesSearch =
        mission.title.toLowerCase().includes(query) ||
        mission.prospect.name.toLowerCase().includes(query);

      const matchesStatus =
        !statusFilter || mission.status === statusFilter;

      const matchesDomain =
        !domainFilter || mission.domain === domainFilter;

      return matchesSearch && matchesStatus && matchesDomain;
    });
  }, [missions, search, statusFilter, domainFilter]);

  return (
    <main className="app">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="page-heading">
          <h1>Mes missions</h1>
          <p>Consultez les missions qui vous sont affectées.</p>
        </div>

        <button
          type="button"
          onClick={() => void loadMissions()}
          disabled={loading}
          className={`action-button ${
            refreshed
              ? 'action-button--success'
              : 'action-button--neutral'
          }`}
        >
          {refreshed ? (
            <Check size={16} />
          ) : (
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
          )}
          {loading
            ? 'Actualisation...'
            : refreshed
              ? 'Actualisé'
              : 'Actualiser'}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher une mission..."
            aria-label="Rechercher une mission"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filtrer par statut"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={domainFilter}
          onChange={(event) => setDomainFilter(event.target.value)}
          aria-label="Filtrer par domaine"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">Tous les domaines</option>
          {Object.entries(domainLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-slate-500">
          Chargement des missions...
        </p>
      ) : (
        <section className="mt-6">
          <p className="mb-3 text-sm text-slate-500">
            {filteredMissions.length} mission(s)
          </p>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Mission</th>
                  <th>Client</th>
                  <th>Domaine</th>
                  <th>Statut</th>
                  <th>Début</th>
                  <th>Fin</th>
                </tr>
              </thead>

              <tbody>
                {filteredMissions.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      Aucune mission ne correspond à votre recherche.
                    </td>
                  </tr>
                ) : (
                  filteredMissions.map((mission) => (
                    <tr
                      key={mission.id}
                      onClick={() => setSelectedMission(mission)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <td className="font-medium text-slate-800">
                        {mission.title}
                      </td>

                      <td>{mission.prospect.name}</td>

                      <td>
                        {domainLabels[mission.domain] ??
                          mission.domain}
                      </td>

                      <td>
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(mission.status)}`}
                        >
                          {statusLabels[mission.status] ??
                            mission.status}
                        </span>
                      </td>

                      <td>{formatDate(mission.startDate)}</td>
                      <td>{formatDate(mission.endDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedMission && (
        <div
          className="management-modal-overlay"
          onClick={() => setSelectedMission(null)}
        >
          <section
            className="management-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="my-mission-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="my-mission-title"
                  className="text-xl font-semibold text-slate-900"
                >
                  {selectedMission.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Détail de la mission
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMission(null)}
                aria-label="Fermer"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">
                  Client
                </dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {selectedMission.prospect.name}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-slate-500">
                  Domaine
                </dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {domainLabels[selectedMission.domain] ??
                    selectedMission.domain}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-slate-500">
                  Statut
                </dt>
                <dd className="mt-1">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(selectedMission.status)}`}
                  >
                    {statusLabels[selectedMission.status] ??
                      selectedMission.status}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-sm text-slate-500">
                  Date de début
                </dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {formatDate(selectedMission.startDate)}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-slate-500">
                  Date de fin
                </dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {formatDate(selectedMission.endDate)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMission(null)}
                className="action-button action-button--neutral"
              >
                Fermer
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
