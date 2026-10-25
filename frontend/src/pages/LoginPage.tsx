import { useState, type SubmitEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
} from 'react-router';

export default function LoginPage() {
  const { user, login, logout, activeSpace, setActiveSpace } = useAuth();
  const navigate = useNavigate();
  const { role } = useParams();

  const isBureauLogin = role === 'bureau';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return (
      <Navigate
        to={activeSpace === 'bureau' ? '/' : '/intervenant'}
        replace
      />
    );
  }

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const connectedUser = await login(email, password);

      if (isBureauLogin && !connectedUser.isBureau) {
        logout();
        setError(
          "Ce compte n'a pas accès à l'espace Bureau.",
        );
        return;
      }

      if (!isBureauLogin && !connectedUser.isIntervenant) {
        logout();
        setError(
          "Ce compte n'a pas accès à l'espace Intervenant.",
        );
        return;
      }

      setActiveSpace(isBureauLogin ? 'bureau' : 'intervenant');

      navigate(
        isBureauLogin ? '/' : '/intervenant',
        { replace: true },
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur de connexion',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-form form-page">
        <Link to="/welcome" className="back">
          ← Changer d'espace
        </Link>

        <h2>
          Connexion {isBureauLogin ? 'Bureau' : 'Intervenant'}
        </h2>

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">
              Adresse email
            </label>

            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />
          </div>

          <div className="field">
            <label htmlFor="password">
              Mot de passe
            </label>

            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />
          </div>

          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="button"
            disabled={submitting}
          >
            {submitting
              ? 'Connexion...'
              : 'Se connecter'}
          </button>
        </form>
      </div>
    </main>
  );
}