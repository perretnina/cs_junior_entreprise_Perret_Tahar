
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
  createIntervenant,
  deleteIntervenant,
  getIntervenants,
  updateIntervenant,
  type Intervenant,
  type IntervenantInput,
} from '../api/intervenants';

const emptyForm: IntervenantInput = {
  firstName: '',
  lastName: '',
  email: '',
  schoolEndDate: '',
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    timeZone: 'UTC',
  });
}

export default function IntervenantsPage() {
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [refreshed, setRefreshed] = useState(false);

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<IntervenantInput>(emptyForm);
  const [selectedIntervenant, setSelectedIntervenant] =
    useState<Intervenant | null>(null);

  async function loadIntervenants(showFeedback = false) {
    setLoading(true);
    setError('');
    setRefreshed(false);

    try {
      const data = await getIntervenants();
      setIntervenants(data);

      if (showFeedback) {
        setRefreshed(true);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger les intervenants.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadIntervenants();
  }, []);

  useEffect(() => {
    if (!refreshed) return;

    const timeout = window.setTimeout(() => {
      setRefreshed(false);
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [refreshed]);

  const filteredIntervenants = useMemo(() => {
    const query = search.trim().toLowerCase();

    return intervenants.filter((intervenant) => {
      const fullName =
        `${intervenant.firstName} ${intervenant.lastName}`.toLowerCase();

      return (
        fullName.includes(query) ||
        intervenant.email.toLowerCase().includes(query)
      );
    });
  }, [intervenants, search]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setSelectedIntervenant(null);
    setFormOpen(true);
    setError('');
  }

  function openEdit(intervenant: Intervenant) {
    setEditingId(intervenant.id);
    setForm({
      firstName: intervenant.firstName,
      lastName: intervenant.lastName,
      email: intervenant.email,
      schoolEndDate: intervenant.schoolEndDate.slice(0, 10),
    });
    setSelectedIntervenant(null);
    setFormOpen(true);
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

    setSaving(true);
    setError('');

    const data: IntervenantInput = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      schoolEndDate: form.schoolEndDate,
    };

    try {
      if (editingId === null) {
        await createIntervenant(data);
      } else {
        await updateIntervenant(editingId, data);
      }

      closeForm();
      await loadIntervenants();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer l'intervenant.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(intervenant: Intervenant) {
    const confirmed = window.confirm(
      `Supprimer ${intervenant.firstName} ${intervenant.lastName} ?`,
    );

    if (!confirmed) return;

    setError('');

    try {
      await deleteIntervenant(intervenant.id);
      setSelectedIntervenant(null);
      await loadIntervenants();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer l'intervenant.",
      );
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="page-heading">
          <h1>Intervenants</h1>
          <p>Gestion des intervenants de la Junior-Entreprise</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadIntervenants(true)}
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

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="relative max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un intervenant..."
            aria-label="Rechercher un intervenant"
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900">
            Liste des intervenants
          </h2>
          <span className="text-sm text-slate-500">
            {filteredIntervenants.length} intervenant(s)
          </span>
        </div>

        {loading ? (
          <p className="p-8 text-center text-slate-500">
            Chargement des intervenants...
          </p>
        ) : filteredIntervenants.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            Aucun intervenant trouvé.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Email</th>
                  <th>Fin de scolarité</th>
                  <th className="text-center">Nombre de missions</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredIntervenants.map((intervenant) => (
                  <tr
                    key={intervenant.id}
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedIntervenant(intervenant)
                    }
                  >
                    <td className="font-medium text-slate-900">
                      {intervenant.lastName}
                    </td>
                    <td>{intervenant.firstName}</td>
                    <td>{intervenant.email}</td>
                    <td>
                      {formatDate(intervenant.schoolEndDate)}
                    </td>
                    <td className="text-center">
                      <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        {intervenant.missions?.length ?? 0}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEdit(intervenant);
                          }}
                          title="Modifier"
                          aria-label={`Modifier ${intervenant.firstName} ${intervenant.lastName}`}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDelete(intervenant);
                          }}
                          title="Supprimer"
                          aria-label={`Supprimer ${intervenant.firstName} ${intervenant.lastName}`}
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
            aria-labelledby="intervenant-form-title"
            className="management-modal max-w-lg"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2
                id="intervenant-form-title"
                className="text-xl font-bold text-slate-900"
              >
                {editingId === null
                  ? 'Ajouter un intervenant'
                  : 'Modifier un intervenant'}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Fermer"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Prénom *
                <input
                  required
                  value={form.firstName}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      firstName: event.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Nom *
                <input
                  required
                  value={form.lastName}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      lastName: event.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Email *
                <input
                  required
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
                Date de fin de scolarité *
                <input
                  required
                  type="date"
                  value={form.schoolEndDate}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      schoolEndDate: event.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
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

      {selectedIntervenant && (
        <div
          className="management-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedIntervenant(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="intervenant-details-title"
            className="management-modal max-w-lg"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2
                id="intervenant-details-title"
                className="text-xl font-bold text-slate-900"
              >
                {selectedIntervenant.firstName}{' '}
                {selectedIntervenant.lastName}
              </h2>

              <button
                type="button"
                onClick={() => setSelectedIntervenant(null)}
                aria-label="Fermer"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium">
                  {selectedIntervenant.email}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">
                  Fin de scolarité
                </dt>
                <dd className="font-medium">
                  {formatDate(
                    selectedIntervenant.schoolEndDate,
                  )}
                </dd>
              </div>

              <div>
                <dt className="mb-2 text-slate-500">
                  Missions affectées
                </dt>

                {selectedIntervenant.missions?.length ? (
                  <ul className="space-y-2">
                    {selectedIntervenant.missions.map(
                      (assignment) => (
                        <li
                          key={assignment.missionId}
                          className="rounded-lg border border-slate-200 p-3"
                        >
                          <p className="font-medium">
                            {assignment.mission.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Fin prévue :{' '}
                            {formatDate(
                              assignment.mission.endDate,
                            )}
                          </p>
                        </li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="text-slate-500">
                    Aucune mission affectée.
                  </p>
                )}
              </div>
            </dl>

            <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => openEdit(selectedIntervenant)}
                className="action-button action-button--primary"
              >
                <Pencil size={16} />
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
