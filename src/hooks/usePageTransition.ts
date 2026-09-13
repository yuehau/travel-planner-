import { useContext } from 'react';
import { PageTransitionContext } from '../contexts/pageTransitionValue';

export const usePageTransition = () => {
  const context = useContext(PageTransitionContext);

  if (!context) {
    throw new Error('usePageTransition must be used within a PageTransitionProvider');
  }

  return context;
};
