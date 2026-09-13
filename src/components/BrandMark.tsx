import Plane from 'lucide-react/dist/esm/icons/plane.mjs';

type BrandMarkProps = {
  size?: 'sm' | 'md';
  interactive?: boolean;
};

const sizeClass = {
  sm: 'h-7 w-7 rounded-lg',
  md: 'h-9 w-9 rounded-xl',
};

const iconSize = {
  sm: 16,
  md: 18,
};

const BrandMark = ({ size = 'md', interactive = false }: BrandMarkProps) => (
  <span
    className={`${sizeClass[size]} flex shrink-0 items-center justify-center bg-gradient-to-br from-mist-900 to-mist-800 text-mist-50 shadow-md shadow-mist-950/20 ${
      interactive ? 'transition-transform group-hover:-rotate-12' : ''
    }`}
    aria-hidden="true"
  >
    <Plane size={iconSize[size]} />
  </span>
);

export default BrandMark;
