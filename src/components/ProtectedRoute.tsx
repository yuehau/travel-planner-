import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = () => {
  const { loading, user, isDemoMode } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-zinc-500 dark:text-zinc-400 flex items-center justify-center">
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
