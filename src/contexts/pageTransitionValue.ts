import { createContext } from 'react';

export type PageTransitionContextValue = {
  isPageLoading: boolean;
  navigateWithLoading: (to: string, options?: { replace?: boolean }) => void;
  startPageTransition: () => void;
};

export const PageTransitionContext = createContext<PageTransitionContextValue | undefined>(undefined);
