type LoadingSpinnerProps = {
  label?: string;
  fullScreen?: boolean;
};

const LoadingSpinner = ({ label = 'Connecting', fullScreen = false }: LoadingSpinnerProps) => {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <div className="h-14 w-14 rounded-full border border-line bg-surface-raised p-1">
        <div className="h-full w-full animate-spin rounded-full border-2 border-line border-t-primary" />
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-ink-muted">{label}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-ink">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
