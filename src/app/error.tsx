'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-panel-bg text-white">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-panel-muted">An error occurred.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-panel-accent px-4 py-2 text-sm font-medium text-white hover:bg-panel-accent-hover"
      >
        Try again
      </button>
    </div>
  );
}
