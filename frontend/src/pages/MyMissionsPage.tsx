
import { useEffect, useState } from 'react';
import { getMyMissions, type MyMission } from '../api/missions';

export default function MyMissionsPage() {
  const [missions, setMissions] = useState<MyMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMissions() {
      try {
        const data = await getMyMissions();
        setMissions(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de charger les missions',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadMissions();
  }, []);

  if (loading) {
    return <p className="p-8">Chargement des missions...</p>;
  }

  if (error) {
    return <p role="alert" className="p-8 text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">
        Mes missions
      </h1>

      {missions.length === 0 ? (
        <p className="text-slate-500">
          Aucune mission ne vous est actuellement affectée.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-sm text-slate-500">
              <tr>
                <th className="px-6 py-4">Mission</th>
                <th className="px-6 py-4">Domaine</th>
                <th className="px-6 py-4">Début</th>
                <th className="px-6 py-4">Fin</th>
                <th className="px-6 py-4">Statut</th>
              </tr>
            </thead>

            <tbody>
              {missions.map((mission) => (
                <tr
                  key={mission.id}
                  className="border-t border-slate-100"
                >
                  <td className="px-6 py-4 font-medium">
                    {mission.title}
                  </td>
                  <td className="px-6 py-4">{mission.domain}</td>
                  <td className="px-6 py-4">
                    {new Date(mission.startDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(mission.endDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">{mission.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
