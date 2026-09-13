import { Link, type LinkProps, useLocation } from 'react-router-dom';
import { usePageTransition } from '../hooks/usePageTransition';

const LoadingLink = ({ onClick, to, ...props }: LinkProps) => {
  const location = useLocation();
  const { startPageTransition } = usePageTransition();

  return (
    <Link
      to={to}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
          return;
        }

        const nextPath = typeof to === 'string' ? to : to.pathname;
        if (nextPath && nextPath !== location.pathname) {
          startPageTransition();
        }
      }}
      {...props}
    />
  );
};

export default LoadingLink;
