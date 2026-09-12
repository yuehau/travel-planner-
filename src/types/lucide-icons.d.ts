declare module 'lucide-react/dist/esm/icons/*.mjs' {
  import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';

  const Icon: ForwardRefExoticComponent<SVGProps<SVGSVGElement> & {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
  } & RefAttributes<SVGSVGElement>>;

  export default Icon;
}
