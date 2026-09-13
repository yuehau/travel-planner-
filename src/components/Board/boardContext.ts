import { createContext, useContext } from 'react';
import type { Place, PlaceLink, TransportMode } from '../../types/database';

export type BoardActions = {
  readOnly: boolean;
  dayFilter: number | null;
  openPlace: (place: Place) => void;
  editPlace: (place: Place) => void;
  duplicatePlace: (place: Place) => void;
  removePlace: (place: Place) => void;
  changeTransport: (link: PlaceLink, mode: TransportMode) => void;
  removeLink: (link: PlaceLink) => void;
};

export const BoardActionsContext = createContext<BoardActions | null>(null);

export const useBoardActions = () => {
  const actions = useContext(BoardActionsContext);
  if (!actions) throw new Error('useBoardActions must be used inside a TripBoard.');
  return actions;
};
