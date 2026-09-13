import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageTransitionContext } from './pageTransitionValue';
import LoadingSpinner from '../components/LoadingSpinner';

export const PageTransitionProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isPageLoading, setIsPageLoading] = useState(false);

  useEffect(() => {
    if (!isPageLoading) return;

    const timeout = window.setTimeout(() => setIsPageLoading(false), 360);
    return () => window.clearTimeout(timeout);
  }, [isPageLoading, location.pathname]);

  const startPageTransition = useCallback(() => {
    setIsPageLoading(true);
  }, []);

  const navigateWithLoading = useCallback((to: string, options?: { replace?: boolean }) => {
    if (to !== location.pathname) {
      setIsPageLoading(true);
    }
    navigate(to, options);
  }, [location.pathname, navigate]);

  const value = useMemo(() => ({
    isPageLoading,
    navigateWithLoading,
    startPageTransition,
  }), [isPageLoading, navigateWithLoading, startPageTransition]);

  return (
    <PageTransitionContext.Provider value={value}>
      {children}
      {isPageLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-surface/70 backdrop-blur-sm">
          <LoadingSpinner />
        </div>
      )}
    </PageTransitionContext.Provider>
  );
};
