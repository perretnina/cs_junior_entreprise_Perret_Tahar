
import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate, useNavigate, useParams } from 'react-router';

export default function LoginPage() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const { role } = useParams();
  const isBureauLogin = role === 'bureau';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={user.isBureau ? '/' : '/intervenant'} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const connectedUser = await login(email, password);
      if (isBureauLogin && !connectedUser.isBureau) {
        logout();
        setError("Ce compte n'a pas accès à l'espace Bureau.");
        return;
      }

      if (!isBureauLogin && !connectedUser.isIntervenant) {
        logout();
        setError("Ce compte n'a pas accès à l'espace Intervenant.");
        return;
      }

      navigate(isBureauLogin ? '/' : '/intervenant', {
        replace: true,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur de connexion',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-lg"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Connexion {isBureauLogin ? 'Bureau' : 'Intervenant'}
          </h1>

          <Link to="/welcome" className="text-sm text-blue-600 hover:underline">
            ← Changer d'espace
          </Link>
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-slate-300 p-3"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-300 p-3"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 p-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
