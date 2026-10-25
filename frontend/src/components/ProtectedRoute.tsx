
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';

type ProtectedRouteProps = {
  bureauOnly?: boolean;
};

export default function ProtectedRoute({
  bureauOnly = false,
}: ProtectedRouteProps) {
  const { user, loading, activeSpace } = useAuth();

  if (loading) {
    return <p className="p-8">Chargement...</p>;
  }

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  if (bureauOnly && activeSpace !== 'bureau') {
    return <Navigate to="/intervenant" replace />;
  }

  if (!bureauOnly && activeSpace !== 'intervenant') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
