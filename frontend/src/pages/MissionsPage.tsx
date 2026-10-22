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
  createMission,
  deleteMission,
  getMissions,
  updateMission,
  type Mission,
  type MissionInput,
} from '../api/missions';
import { getProspects, type Prospect } from '../api/prospects';
import {
  getIntervenants,
  type Intervenant,
} from '../api/intervenants';

const statusLabels: Record<MissionInput['status'], string> = {
  DEVIS: 'Devis',
  SIGNE: 'Signée',
  FACTURE_ACOMPTE_EMISE: 'Facture acompte émise',
  FACTURE_ACOMPTE_PAYEE: 'Acompte payé',
  EN_COURS: 'En cours',
  FACTURE_SOLDE_EMISE: 'Facture solde émise',
  FACTURE_SOLDE_PAYEE: 'Solde payé',
  TERMINEE: 'Terminée',
};

const domainLabels: Record<MissionInput['domain'], string> = {
  INFORMATIQUE: 'Informatique',
  MICROELECTRONIQUE: 'Microélectronique',
};

const emptyForm: MissionInput = {
  title: '',
  price: 0,
  startDate: '',
  endDate: '',
  signedAt: null,
  status: 'DEVIS',
  domain: 'INFORMATIQUE',
  prospectId: 0,
  intervenantIds: [],
};

function formatDate(date: string | null) {
  if (!date) return '—';

  return new Date(date).toLocaleDateString('fr-FR', {
    timeZone: 'UTC',
  });
}

function formatPrice(price: string) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(price));
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

function dateInput(date: string | null) {
  return date ? date.slice(0, 10) : '';
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [refreshed, setRefreshed] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

  const [selectedMission, setSelectedMission] =
    useState<Mission | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MissionInput>({ ...emptyForm });

  async function loadMissions(showFeedback = false) {
    setLoading(true);
    setError('');
    setRefreshed(false);

    try {
      const data = await getMissions();
      setMissions(data);

      if (showFeedback) {
        setRefreshed(true);
      }
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

  async function loadFormOptions() {
    const [prospectData, intervenantData] = await Promise.all([
      getProspects(),
      getIntervenants(),
    ]);

    setProspects(prospectData);
    setIntervenants(intervenantData);

    return prospectData;
  }

  async function openCreate() {
    setError('');
    setFormError('');

    try {
      const prospectData = await loadFormOptions();

      setEditingId(null);
      setForm({
        ...emptyForm,
        intervenantIds: [],
        prospectId: prospectData[0]?.id ?? 0,
      });
      setSelectedMission(null);
      setFormOpen(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de préparer le formulaire.',
      );
    }
  }

  async function openEdit(mission: Mission) {
    setError('');
    setFormError('');

    try {
      await loadFormOptions();

      setEditingId(mission.id);
      setForm({
        title: mission.title,
        price: Number(mission.price),
        startDate: dateInput(mission.startDate),
        endDate: dateInput(mission.endDate),
        signedAt: dateInput(mission.signedAt) || null,
        status: mission.status as MissionInput['status'],
        domain: mission.domain as MissionInput['domain'],
        prospectId: mission.prospect.id,
        intervenantIds: mission.intervenants.map(
          ({ intervenant }) => intervenant.id,
        ),
      });
      setSelectedMission(null);
      setFormOpen(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de préparer la modification.',
      );
    }
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setFormError('');
  }

  function toggleIntervenant(id: number) {
    setForm((current) => ({
      ...current,
      intervenantIds: current.intervenantIds.includes(id)
        ? current.intervenantIds.filter((value) => value !== id)
        : [...current.intervenantIds, id],
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError('');

    if (form.endDate < form.startDate) {
      setFormError(
        'La date de fin doit être postérieure ou égale à la date de début.',
      );
      return;
    }

    if (!form.prospectId) {
      setFormError('Sélectionne un prospect.');
      return;
    }

    setSaving(true);

    try {
      const data: MissionInput = {
        ...form,
        title: form.title.trim(),
        signedAt: form.signedAt || null,
      };

      if (editingId === null) {
        await createMission(data);
      } else {
        await updateMission(editingId, data);
      }

      closeForm();
      await loadMissions();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer la mission.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(mission: Mission) {
    const confirmed = window.confirm(
      `Supprimer définitivement la mission « ${mission.title} » ?`,
    );

    if (!confirmed) return;

    setError('');

    try {
      await deleteMission(mission.id);
      setSelectedMission(null);
      await loadMissions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de supprimer la mission.',
      );
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Missions
          </h1>
          <p className="mt-2 text-slate-500">
            Consultez et suivez les missions de la Junior-Entreprise.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadMissions(true)}
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
            onClick={() => void openCreate()}
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
            placeholder="Rechercher une mission..."
            aria-label="Rechercher une mission"
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filtrer par statut"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
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
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
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
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900">
            Liste des missions
          </h2>
          <span className="text-sm text-slate-500">
            {filteredMissions.length} mission(s)
          </span>
        </div>

        {loading ? (
          <p className="p-8 text-center text-slate-500">
            Chargement des missions...
          </p>
        ) : !error && filteredMissions.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            Aucune mission trouvée.
          </p>
        ) : !error ? (
          <div className="overflow-x-auto">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Mission</th>
                  <th>Prospect</th>
                  <th>Domaine</th>
                  <th>Statut</th>
                  <th>Début</th>
                  <th>Montant</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredMissions.map((mission) => (
                  <tr
                    key={mission.id}
                    onClick={() => setSelectedMission(mission)}
                    className="cursor-pointer"
                  >
                    <td className="font-medium text-slate-900">
                      {mission.title}
                    </td>
                    <td className="text-slate-600">
                      {mission.prospect.name}
                    </td>
                    <td className="text-slate-600">
                      {domainLabels[mission.domain as MissionInput['domain']] ??
                        mission.domain}
                    </td>
                    <td>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(mission.status)}`}
                      >
                        {statusLabels[mission.status as MissionInput['status']] ??
                          mission.status}
                      </span>
                    </td>
                    <td className="text-slate-600">
                      {formatDate(mission.startDate)}
                    </td>
                    <td className="font-medium text-slate-700">
                      {formatPrice(mission.price)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void openEdit(mission);
                          }}
                          title="Modifier"
                          aria-label={`Modifier ${mission.title}`}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDelete(mission);
                          }}
                          title="Supprimer"
                          aria-label={`Supprimer ${mission.title}`}
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
        ) : null}
      </section>

      {formOpen && (
        <div
          className="management-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeForm();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mission-form-title"
            className="management-modal max-w-xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2
                id="mission-form-title"
                className="text-xl font-bold text-slate-900"
              >
                {editingId === null
                  ? 'Ajouter une mission'
                  : 'Modifier une mission'}
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
                Titre de la mission *
                <input
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  className={inputClass}
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Prospect *
                <select
                  required
                  value={form.prospectId || ''}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      prospectId: Number(event.target.value),
                    })
                  }
                  className={inputClass}
                >
                  <option value="">Sélectionner un prospect</option>
                  {prospects.map((prospect) => (
                    <option key={prospect.id} value={prospect.id}>
                      {prospect.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-medium text-slate-700">
                  Domaine *
                  <select
                    value={form.domain}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        domain: event.target.value as MissionInput['domain'],
                      })
                    }
                    className={inputClass}
                  >
                    {Object.entries(domainLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Statut *
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as MissionInput['status'],
                      })
                    }
                    className={inputClass}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Montant (€) *
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      price: Number(event.target.value),
                    })
                  }
                  className={inputClass}
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-medium text-slate-700">
                  Date de début *
                  <input
                    required
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        startDate: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Date de fin *
                  <input
                    required
                    type="date"
                    min={form.startDate || undefined}
                    value={form.endDate}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        endDate: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Date de signature (facultative)
                <input
                  type="date"
                  value={form.signedAt || ''}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      signedAt: event.target.value || null,
                    })
                  }
                  className={inputClass}
                />
              </label>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Intervenants affectés
                </p>
                <p className="mb-3 text-xs text-slate-500">
                  Facultatif. Plusieurs intervenants peuvent être sélectionnés.
                </p>

                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
                  {intervenants.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Aucun intervenant disponible.
                    </p>
                  ) : (
                    intervenants.map((intervenant) => {
                      const unavailable =
                        Boolean(form.endDate) &&
                        intervenant.schoolEndDate.slice(0, 10) <
                          form.endDate;

                      return (
                        <label
                          key={intervenant.id}
                          className={`flex items-center gap-3 rounded-lg p-2 text-sm ${
                            unavailable
                              ? 'text-slate-400'
                              : 'cursor-pointer hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={form.intervenantIds.includes(
                              intervenant.id,
                            )}
                            disabled={unavailable}
                            onChange={() =>
                              toggleIntervenant(intervenant.id)
                            }
                          />
                          <span>
                            {intervenant.firstName}{' '}
                            {intervenant.lastName}
                            <span className="ml-2 text-xs text-slate-500">
                              Fin de scolarité :{' '}
                              {formatDate(intervenant.schoolEndDate)}
                            </span>
                            {unavailable && (
                              <span className="ml-2 text-xs text-red-600">
                                Non éligible
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {formError}
                </div>
              )}

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
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedMission && (
        <div
          className="management-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedMission(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mission-dialog-title"
            className="management-modal max-w-xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2
                id="mission-dialog-title"
                className="text-xl font-bold text-slate-900"
              >
                {selectedMission.title}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedMission(null)}
                aria-label="Fermer les détails"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <dl className="grid grid-cols-2 gap-5 text-sm">
              <div>
                <dt className="text-slate-500">Prospect</dt>
                <dd className="mt-1 font-medium">
                  {selectedMission.prospect.name}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">Domaine</dt>
                <dd className="mt-1 font-medium">
                  {domainLabels[selectedMission.domain as MissionInput['domain']] ??
                    selectedMission.domain}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">Statut</dt>
                <dd className="mt-1 font-medium">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs ${getStatusStyle(selectedMission.status)}`}
                  >
                    {statusLabels[selectedMission.status as MissionInput['status']] ??
                      selectedMission.status}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">Montant</dt>
                <dd className="mt-1 font-medium">
                  {formatPrice(selectedMission.price)}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">Date de début</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(selectedMission.startDate)}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">Date de fin</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(selectedMission.endDate)}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">Date de signature</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(selectedMission.signedAt)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <h3 className="font-semibold text-slate-900">
                Intervenants affectés
              </h3>

              {selectedMission.intervenants.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  Aucun intervenant affecté à cette mission.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {selectedMission.intervenants.map(({ intervenant }) => (
                    <li
                      key={intervenant.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                    >
                      {intervenant.firstName} {intervenant.lastName}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => void openEdit(selectedMission)}
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
