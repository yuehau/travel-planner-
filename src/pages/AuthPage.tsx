import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandMark from '../components/BrandMark';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../hooks/useAuth';

type AuthPageProps = {
  mode: 'signin' | 'signup';
};

const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const { signInWithGoogle, configurationError, setDemoMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = mode === 'signin' ? 'Sign in' : 'Create your account';
  const buttonText = mode === 'signin' ? 'Continue with Google' : 'Sign up with Google';
  const redirectPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  const handleGoogleAuth = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      await signInWithGoogle(redirectPath);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed.');
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = () => {
    setDemoMode(true);
    navigate(redirectPath, { replace: true });
  };

  return (
    <main className="min-h-screen bg-sand-50 dark:bg-sand-950 text-sand-900 dark:text-sand-100 flex items-center justify-center px-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <section className="w-full max-w-sm">
        <Link to="/" className="group inline-flex items-center gap-2 text-xl font-semibold tracking-tight mb-10">
          <BrandMark interactive />
          TravelPlanner
        </Link>

        <h1 className="text-3xl font-bold tracking-tighter mb-3">{title}</h1>
        <p className="text-sm text-sand-500 dark:text-sand-400 mb-8">
          Use Google to keep your trips private and synced.
        </p>

        {configurationError && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {configurationError}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isSubmitting || Boolean(configurationError)}
          className="w-full rounded-full bg-clay-600 dark:bg-clay-500 text-white dark:text-white px-5 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Opening Google...' : buttonText}
        </button>

        <button
          type="button"
          onClick={handleDemoClick}
          className="mt-3 w-full rounded-full px-5 py-3 font-medium text-sand-600 hover:text-sand-900 dark:text-sand-400 dark:hover:text-sand-100"
        >
          Try read-only demo
        </button>
      </section>
    </main>
  );
};

export default AuthPage;
