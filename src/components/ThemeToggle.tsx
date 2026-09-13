import Moon from 'lucide-react/dist/esm/icons/moon.mjs';
import Sun from 'lucide-react/dist/esm/icons/sun.mjs';
import { useTheme } from '../hooks/useTheme';

type ThemeToggleProps = {
  variant?: 'circle' | 'square';
};

const ThemeToggle = ({ variant = 'square' }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'light' ? 'dark' : 'light';
  const Icon = theme === 'light' ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 text-sand-500 transition-colors hover:bg-sand-100 hover:text-clay-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500 dark:text-sand-400 dark:hover:bg-sand-900 dark:hover:text-clay-300 ${
        variant === 'circle' ? 'rounded-full' : 'rounded-xl'
      }`}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <Icon size={20} />
    </button>
  );
};

export default ThemeToggle;
