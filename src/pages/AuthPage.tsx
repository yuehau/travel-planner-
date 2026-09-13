import { useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import BrandMark from '../components/BrandMark';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../hooks/useAuth';
import LoadingLink from '../components/LoadingLink';
import { usePageTransition } from '../hooks/usePageTransition';
import { getAuthErrorMessage } from '../utils/authErrors';

type AuthPageProps = {
  mode: 'signin' | 'signup';
};

const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const {
    authMode,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    configurationError,
    setDemoMode,
  } = useAuth();
  const location = useLocation();
  const { navigateWithLoading } = usePageTransition();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: mode === 'signin' ? 'demo@travelplanner.local' : '',
    password: mode === 'signin' ? 'TravelPlanner123!' : '',
  });

  const title = mode === 'signin' ? 'Sign in' : 'Create your account';
  const buttonText = mode === 'signin' ? 'Sign in' : 'Create account';
  const redirectPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  const handlePasswordAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        await signInWithPassword(formData.email, formData.password);
      } else {
        await signUpWithPassword(formData.email, formData.password, formData.fullName);
      }
      navigateWithLoading(redirectPath, { replace: true });
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      await signInWithGoogle(redirectPath);
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = () => {
    setDemoMode(true);
    navigateWithLoading(redirectPath, { replace: true });
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-6 text-ink">
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-mist-600/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-mist-800/20 blur-3xl" />
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <section className="relative w-full max-w-sm rounded-3xl border border-line bg-surface-raised/90 p-8 shadow-xl shadow-mist-950/10 backdrop-blur animate-rise-in">
        <LoadingLink to="/" className="group mb-8 inline-flex items-center gap-2 text-xl font-semibold tracking-tight">
          <BrandMark interactive />
          TravelPlanner
        </LoadingLink>

        <h1 className="mb-3 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mb-8 text-sm text-ink-muted">
          {mode === 'signin' ? 'Pick up your boards where you left them.' : 'Your account lives on this machine in the local prototype.'}
        </p>

        {configurationError && (
          <div className="mb-4 rounded-xl border border-mist-600 bg-mist-200 px-4 py-3 text-sm text-mist-950 dark:bg-mist-900/30 dark:text-mist-100">
            {configurationError}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-mist-500 bg-mist-100 px-4 py-3 text-sm text-danger dark:bg-mist-950/40 dark:text-mist-200">
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordAuth} className="space-y-3">
          {mode === 'signup' && (
            <input
              value={formData.fullName}
              onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))}
              placeholder="Full name"
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none transition placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          )}
          <input
            required
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
            placeholder="Email"
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none transition placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <input
            required
            minLength={8}
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={formData.password}
            onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
            placeholder="Password"
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none transition placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-primary px-5 py-3 font-semibold text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Checking account...' : buttonText}
          </button>
        </form>

        {mode === 'signin' && (
          <p className="mt-3 rounded-xl border border-dashed border-line-strong px-4 py-3 text-xs text-ink-muted">
            Demo login: demo@travelplanner.local / TravelPlanner123!
          </p>
        )}

        {authMode === 'supabase' && (
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isSubmitting || Boolean(configurationError)}
            className="mt-3 w-full rounded-full border border-line px-5 py-3 font-medium text-ink-muted transition-colors hover:border-mist-700 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue with Google
          </button>
        )}

        <button
          type="button"
          onClick={handleDemoClick}
          className="mt-3 w-full rounded-full px-5 py-3 font-medium text-accent-hover transition-colors hover:bg-mist-100 dark:hover:bg-mist-950/40"
        >
          Explore the demo boards instead
        </button>
      </section>
    </main>
  );
};

export default AuthPage;
