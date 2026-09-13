import Bus from 'lucide-react/dist/esm/icons/bus.mjs';
import Car from 'lucide-react/dist/esm/icons/car.mjs';
import Footprints from 'lucide-react/dist/esm/icons/footprints.mjs';
import TrainFront from 'lucide-react/dist/esm/icons/train-front.mjs';
import type { TransportMode } from '../types/database';

export type TransportOption = {
  mode: TransportMode;
  label: string;
  icon: typeof Footprints;
  /** Average door-to-door speed used for rough leg estimates. */
  speedKmh: number;
};

export const transportOptions: TransportOption[] = [
  { mode: 'walk', label: 'Walk', icon: Footprints, speedKmh: 4.5 },
  { mode: 'train', label: 'Train', icon: TrainFront, speedKmh: 55 },
  { mode: 'bus', label: 'Bus', icon: Bus, speedKmh: 22 },
  { mode: 'car', label: 'Car', icon: Car, speedKmh: 38 },
];

export const transportModes = transportOptions.map((option) => option.mode);

export const getTransportOption = (mode: TransportMode | null | undefined) => (
  transportOptions.find((option) => option.mode === mode) ?? transportOptions[0]
);
