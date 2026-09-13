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
      className={`p-2 text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 ${
        variant === 'circle' ? 'rounded-full' : 'rounded-md'
      }`}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <Icon size={20} />
    </button>
  );
};

export default ThemeToggle;
