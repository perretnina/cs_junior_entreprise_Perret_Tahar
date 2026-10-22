import { useEffect, useState } from 'react';
import {
  getMyMissions,
  type MyMission,
} from '../api/missions';

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
    return (
      <div className="app">
        <p className="status">
          Chargement des missions...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <main className="app">
      <div className="page-heading">
        <h1>Mes missions</h1>
        <p>
          Liste des missions qui vous sont affectées
        </p>
      </div>

      {missions.length === 0 ? (
        <p className="empty">
          Aucune mission ne vous est actuellement affectée.
        </p>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mission</th>
                <th>Domaine</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Statut</th>
              </tr>
            </thead>

            <tbody>
              {missions.map((mission) => (
                <tr key={mission.id}>
                  <td>{mission.title}</td>
                  <td>{mission.domain}</td>
                  <td>
                    {new Date(
                      mission.startDate,
                    ).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    {new Date(
                      mission.endDate,
                    ).toLocaleDateString('fr-FR')}
                  </td>
                  <td>{mission.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}