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
    <div className="flex min-h-screen items-center justify-center bg-surface text-ink-muted">
      Loading demo...
    </div>
  );
};

export default DemoRedirect;
