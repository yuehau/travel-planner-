import { useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  createDemoTravelDataClient,
  createSupabaseTravelDataClient,
  type TravelDataClient,
} from '../services/travelData';

export const useTravelDataClient = (): TravelDataClient | null => {
  const { user, isDemoMode } = useAuth();
  const userId = user?.id;

  return useMemo(() => {
    if (isDemoMode) {
      return createDemoTravelDataClient();
    }

    if (userId) {
      return createSupabaseTravelDataClient(userId);
    }

    return null;
  }, [isDemoMode, userId]);
};
