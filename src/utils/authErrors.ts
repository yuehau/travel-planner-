export const getAuthErrorMessage = (error: unknown) => {
  const candidate =
    error instanceof Error
      ? error.message
      : error && typeof error === 'object'
        ? 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'msg' in error && typeof error.msg === 'string'
            ? error.msg
            : 'error_description' in error && typeof error.error_description === 'string'
              ? error.error_description
              : String(error)
        : String(error);
  const message = candidate;
  const normalized = message.toLowerCase();

  if (normalized.includes('unsupported provider') || normalized.includes('provider is not enabled')) {
    return 'Google sign-in is not enabled in Supabase yet. Enable the Google provider in Supabase Auth, then try again.';
  }

  if (normalized.includes('invalid login credentials')) {
    return 'The sign-in details were not accepted. Try again or use the demo workspace.';
  }

  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'Could not reach the auth server. Check your connection and try again.';
  }

  return message || 'Authentication failed.';
};
