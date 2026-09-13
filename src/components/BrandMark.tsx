import Plane from 'lucide-react/dist/esm/icons/plane.mjs';

type BrandMarkProps = {
  size?: 'sm' | 'md';
  interactive?: boolean;
};

const sizeClass = {
  sm: 'h-7 w-7 rounded-md',
  md: 'h-8 w-8 rounded-lg',
};

const iconSize = {
  sm: 16,
  md: 18,
};

const BrandMark = ({ size = 'md', interactive = false }: BrandMarkProps) => (
  <span
    className={`${sizeClass[size]} flex shrink-0 items-center justify-center bg-coral-500 text-white ${
      interactive ? 'transition-transform group-hover:rotate-6' : ''
    }`}
    aria-hidden="true"
  >
    <Plane size={iconSize[size]} />
  </span>
);

export default BrandMark;
