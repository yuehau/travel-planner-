import Briefcase from 'lucide-react/dist/esm/icons/briefcase.mjs';
import Calendar from 'lucide-react/dist/esm/icons/calendar.mjs';
import CheckSquare from 'lucide-react/dist/esm/icons/square-check-big.mjs';
import Info from 'lucide-react/dist/esm/icons/info.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import Settings from 'lucide-react/dist/esm/icons/settings.mjs';
import Users from 'lucide-react/dist/esm/icons/users.mjs';
import Wallet from 'lucide-react/dist/esm/icons/wallet.mjs';
import type { LucideIcon } from 'lucide-react';

export type TripTab = 'itinerary' | 'places' | 'budget' | 'checklist' | 'todos' | 'info' | 'sharing' | 'settings';

export type TripTabDefinition = {
  id: TripTab;
  label: string;
  icon: LucideIcon;
};

export const tripTabs: TripTabDefinition[] = [
  { id: 'itinerary', label: 'Itinerary', icon: Calendar },
  { id: 'places', label: 'Places', icon: MapPin },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'checklist', label: 'Packing', icon: Briefcase },
  { id: 'todos', label: 'To-Dos', icon: CheckSquare },
  { id: 'info', label: 'Essentials', icon: Info },
  { id: 'sharing', label: 'Sharing', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];
