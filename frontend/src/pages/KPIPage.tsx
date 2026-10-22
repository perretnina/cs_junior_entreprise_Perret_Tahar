
import { useEffect, useState } from 'react';
import {
  BarChart3,
  Check,
  Clock3,
  Euro,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  getKpi,
  type Kpi,
  type KpiDomain,
} from '../api/kpi';

const currentYear = new Date().getFullYear();

const months = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const numberFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 1,
});

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export default function KpiPage() {
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState('');
  const [domain, setDomain] = useState('');

  const [kpi, setKpi] = useState<Kpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshed, setRefreshed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleYearChange(value: string) {
    setYear(value);
    setMonth('');
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      setRefreshed(false);

      try {
        const data = await getKpi(
          year ? Number(year) : undefined,
          domain ? (domain as KpiDomain) : undefined,
          year === String(currentYear) && month
            ? Number(month)
            : undefined,
        );

        if (!active) return;

        setKpi(data);

        if (refreshKey > 0) {
          setRefreshed(true);
        }
      } catch (err) {
        if (!active) return;

        setKpi(null);
        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de charger les indicateurs.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [year, month, domain, refreshKey]);

  useEffect(() => {
    if (!refreshed) return;

    const timeout = window.setTimeout(() => {
      setRefreshed(false);
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [refreshed]);

  const cards = kpi
    ? [
        {
          title: 'Nombre de missions',
          value: numberFormatter.format(kpi.totalMissions),
          description: 'Missions débutées sur la période',
          icon: BarChart3,
        },
        {
          title: "Chiffre d'affaires signé",
          value: currencyFormatter.format(kpi.signedRevenue),
          description: 'Contrats signés sur la période',
          icon: Euro,
        },
        {
          title: 'Prix moyen signé',
          value: currencyFormatter.format(kpi.averageSignedPrice),
          description: 'Montant moyen des missions signées',
          icon: TrendingUp,
        },
        {
          title: "Durée moyenne d'une mission",
          value: `${decimalFormatter.format(kpi.averageDurationDays)} jours`,
          description: 'Calculée à partir des dates de début et de fin prévues',
          icon: Clock3,
        },
        {
          title: 'Intervenants mobilisés',
          value: numberFormatter.format(kpi.distinctIntervenants),
          description: 'Intervenants distincts affectés',
          icon: Users,
        },
        {
          title: 'Taux de conversion',
          value: `${decimalFormatter.format(kpi.conversionRate)} %`,
          description: 'Prospects contactés ayant signé une mission',
          icon: Check,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            KPI
          </h1>
          <p className="mt-2 text-slate-500">
            Indicateurs de performance de la Junior-Entreprise
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
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

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="kpi-year"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Année
            </label>
            <select
              id="kpi-year"
              value={year}
              onChange={(event) => handleYearChange(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">Toutes les années</option>
              {Array.from(
                { length: 8 },
                (_, index) => currentYear - index,
              ).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="kpi-month"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Mois
            </label>
            <select
              id="kpi-month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              disabled={year !== String(currentYear)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">Tous les mois</option>
              {months.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="kpi-domain"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Domaine
            </label>
            <select
              id="kpi-domain"
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">Tous</option>
              <option value="INFORMATIQUE">Informatique</option>
              <option value="MICROELECTRONIQUE">
                Microélectronique
              </option>
            </select>
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Chargement des indicateurs...
        </div>
      ) : kpi ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm font-medium text-slate-600">
                    {card.title}
                  </h2>
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                    <Icon size={19} />
                  </div>
                </div>

                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {card.value}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {card.description}
                </p>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
