
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';

type ProtectedRouteProps = {
  bureauOnly?: boolean;
};

export default function ProtectedRoute({
  bureauOnly = false,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="p-8">Chargement...</p>;
  }

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  if (bureauOnly && !user.isBureau) {
    return <Navigate to="/intervenant" replace />;
  }

  return <Outlet />;
}
