import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import {
  getProspects,
  createProspect,
  updateProspect,
  deleteProspect,
  type Prospect,
  type ProspectStatus,
  type ProspectDomain,
} from '../api/prospects';

const statusLabels: Record<string, string> = {
  PAS_ENCORE_CONTACTE: 'Pas encore contacté',
  A_RECONTACTER: 'À recontacter',
  PAS_INTERESSE: 'Pas intéressé',
  EN_COURS: 'En cours',
  A_FIDELISER: 'À fidéliser',
};

function getStatusStyle(status: string) {
  switch (status) {
    case 'PAS_ENCORE_CONTACTE':
      return 'bg-slate-100 text-slate-700';

    case 'A_RECONTACTER':
      return 'bg-orange-100 text-orange-800';

    case 'PAS_INTERESSE':
      return 'bg-red-100 text-red-800';

    case 'EN_COURS':
      return 'bg-blue-100 text-blue-800';

    case 'A_FIDELISER':
      return 'bg-green-100 text-green-800';

    default:
      return 'bg-slate-100 text-slate-700';
  }
}

const domainLabels: Record<string, string> = {
  INFORMATIQUE: 'Informatique',
  MICROELECTRONIQUE: 'Microélectronique',
};

type ProspectForm = {
  name: string;
  email: string;
  phone: string;
  domain: ProspectDomain;
  status: ProspectStatus;
};

const emptyForm: ProspectForm = {
  name: '',
  email: '',
  phone: '',
  domain: 'INFORMATIQUE',
  status: 'PAS_ENCORE_CONTACTE',
};

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [refreshed, setRefreshed] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProspectForm>(emptyForm);

  const [selectedProspect, setSelectedProspect] =
    useState<Prospect | null>(null);

  async function loadProspects(showFeedback = false) {
    setLoading(true);
    setError('');
    setRefreshed(false);

    try {
      const data = await getProspects();
      setProspects(data);

      if (showFeedback) {
        setRefreshed(true);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger les prospects.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProspects();
  }, []);

  useEffect(() => {
    if (!refreshed) return;

    const timeout = window.setTimeout(() => {
      setRefreshed(false);
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [refreshed]);

  const filteredProspects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return prospects.filter((prospect) => {
      const matchesSearch =
        prospect.name.toLowerCase().includes(query) ||
        (prospect.email ?? '').toLowerCase().includes(query) ||
        (prospect.phone ?? '').toLowerCase().includes(query);

      const matchesStatus =
        !statusFilter || prospect.status === statusFilter;

      const matchesDomain =
        !domainFilter || prospect.domain === domainFilter;

      return matchesSearch && matchesStatus && matchesDomain;
    });
  }, [prospects, search, statusFilter, domainFilter]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setFormOpen(true);
    setSelectedProspect(null);
    setError('');
  }

  function openEdit(prospect: Prospect) {
    setEditingId(prospect.id);
    setForm({
      name: prospect.name,
      email: prospect.email ?? '',
      phone: prospect.phone ?? '',
      domain: prospect.domain,
      status: prospect.status,
    });
    setFormOpen(true);
    setSelectedProspect(null);
    setError('');
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('Le nom du prospect est obligatoire.');
      return;
    }

    setSaving(true);
    setError('');

    const data = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      domain: form.domain,
      status: form.status,
    };

    try {
      if (editingId === null) {
        await createProspect(data);
      } else {
        await updateProspect(editingId, data);
      }

      closeForm();
      await loadProspects();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible d’enregistrer le prospect.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(prospect: Prospect) {
    if (
      !window.confirm(
        `Supprimer le prospect « ${prospect.name} » ?`,
      )
    ) {
      return;
    }

    setError('');

    try {
      await deleteProspect(prospect.id);
      setSelectedProspect(null);
      await loadProspects();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de supprimer le prospect.',
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Prospection
          </h1>
          <p className="mt-2 text-slate-500">
            Gérez les prospects et suivez leur avancement.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadProspects(true)}
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

          <button
            type="button"
            onClick={
              formOpen && editingId === null
                ? closeForm
                : openCreate
            }
            className={`action-button ${
              formOpen && editingId === null
                ? 'action-button--success'
                : 'action-button--primary'
            }`}
          >
            {formOpen && editingId === null ? (
              <Check size={16} />
            ) : (
              <Plus size={16} />
            )}
            {formOpen && editingId === null
              ? 'Ajout en cours'
              : 'Ajouter'}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un prospect..."
            aria-label="Rechercher un prospect"
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          aria-label="Filtrer par statut"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
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
          onChange={(event) =>
            setDomainFilter(event.target.value)
          }
          aria-label="Filtrer par domaine"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Tous les domaines</option>
          {Object.entries(domainLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900">
            Liste des prospects
          </h2>
          <span className="text-sm text-slate-500">
            {filteredProspects.length} prospect(s)
          </span>
        </div>

        {loading ? (
          <p className="p-8 text-center text-slate-500">
            Chargement des prospects...
          </p>
        ) : filteredProspects.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            Aucun prospect trouvé.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Prospect</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Domaine</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProspects.map((prospect) => (
                  <tr
                    key={prospect.id}
                    onClick={() =>
                      setSelectedProspect(prospect)
                    }
                    className="cursor-pointer"
                  >
                    <td className="font-medium text-slate-900">
                      {prospect.name}
                    </td>
                    <td className="text-slate-600">
                      {prospect.email || '—'}
                    </td>
                    <td className="text-slate-600">
                      {prospect.phone || '—'}
                    </td>
                    <td className="text-slate-600">
                      {domainLabels[prospect.domain] ??
                        prospect.domain}
                    </td>
                    <td>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(prospect.status)}`}
                      >
                        {statusLabels[prospect.status] ??
                          prospect.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEdit(prospect);
                          }}
                          title="Modifier"
                          aria-label={`Modifier ${prospect.name}`}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDelete(prospect);
                          }}
                          title="Supprimer"
                          aria-label={`Supprimer ${prospect.name}`}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formOpen && (
        <div
          className="management-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              closeForm();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="prospect-form-title"
            className="management-modal max-w-lg"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2
                id="prospect-form-title"
                className="text-xl font-bold text-slate-900"
              >
                {editingId === null
                  ? 'Ajouter un prospect'
                  : 'Modifier le prospect'}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Fermer le formulaire"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <label className="block text-sm font-medium text-slate-700">
                Nom du prospect *
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      email: event.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Téléphone
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      phone: event.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Domaine
                <select
                  value={form.domain}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      domain: event.target
                        .value as ProspectDomain,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                >
                  {Object.entries(domainLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Statut
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target
                        .value as ProspectStatus,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                >
                  {Object.entries(statusLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="action-button action-button--neutral"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="action-button action-button--primary"
                >
                  {saving
                    ? 'Enregistrement...'
                    : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedProspect && (
        <div
          className="management-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedProspect(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="prospect-details-title"
            className="management-modal max-w-lg"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2
                id="prospect-details-title"
                className="text-xl font-bold text-slate-900"
              >
                {selectedProspect.name}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setSelectedProspect(null)
                }
                aria-label="Fermer les détails"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">
                  Email
                </dt>
                <dd className="font-medium">
                  {selectedProspect.email || '—'}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">
                  Téléphone
                </dt>
                <dd className="font-medium">
                  {selectedProspect.phone || '—'}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">
                  Domaine
                </dt>
                <dd className="font-medium">
                  {domainLabels[selectedProspect.domain] ??
                    selectedProspect.domain}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">
                  Statut
                </dt>
                <dd className="font-medium">
                  {statusLabels[selectedProspect.status] ??
                    selectedProspect.status}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() =>
                  openEdit(selectedProspect)
                }
                className="action-button action-button--primary"
              >
                <Pencil size={16} />
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
