import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DemoRedirect = () => {
  const { setDemoMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setDemoMode(true);
    navigate('/dashboard', { replace: true });
  }, [navigate, setDemoMode]);

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-sand-950 text-sand-500 dark:text-sand-400 flex items-center justify-center">
      Loading demo...
    </div>
  );
};

export default DemoRedirect;
