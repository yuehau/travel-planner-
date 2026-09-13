import { useMemo } from 'react';
import { useAuth } from './useAuth';
import type { TravelDataClient } from '../services/travelData';
import { createDemoTravelDataClient } from '../services/demoTravelData';
import { createLocalTravelDataClient } from '../services/localTravelData';
import { createSupabaseTravelDataClient } from '../services/supabaseTravelData';

export const useTravelDataClient = (): TravelDataClient | null => {
  const { user, isDemoMode, authMode } = useAuth();
  const userId = user?.id;

  return useMemo(() => {
    if (isDemoMode) {
      return createDemoTravelDataClient();
    }

    if (userId) {
      if (authMode === 'local') {
        return createLocalTravelDataClient();
      }
      return createSupabaseTravelDataClient(userId);
    }

    return null;
  }, [authMode, isDemoMode, userId]);
};
