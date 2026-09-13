import Plane from 'lucide-react/dist/esm/icons/plane.mjs';

type BrandMarkProps = {
  size?: 'sm' | 'md';
  interactive?: boolean;
};

const sizeClass = {
  sm: 'h-8 w-8 rounded-xl',
  md: 'h-10 w-10 rounded-2xl',
};

const iconSize = {
  sm: 16,
  md: 20,
};

const BrandMark = ({ size = 'md', interactive = false }: BrandMarkProps) => (
  <span
    className={`${sizeClass[size]} flex shrink-0 items-center justify-center bg-gradient-to-br from-clay-400 to-clay-600 text-white shadow-sm shadow-clay-500/25 ${
      interactive ? 'transition-transform duration-300 group-hover:-rotate-12' : ''
    }`}
    aria-hidden="true"
  >
    <Plane size={iconSize[size]} strokeWidth={2} />
  </span>
);

export default BrandMark;
