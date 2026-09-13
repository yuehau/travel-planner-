import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = () => {
  const { loading, user, isDemoMode } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-50 dark:bg-sand-950 text-sand-500 dark:text-sand-400 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user && !isDemoMode) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
