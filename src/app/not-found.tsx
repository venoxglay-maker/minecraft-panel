import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-panel-bg text-white">
      <h1 className="text-2xl font-semibold">404 – Not Found</h1>
      <p className="text-panel-muted">This page does not exist.</p>
      <Link
        href="/"
        className="rounded-lg bg-panel-accent px-4 py-2 text-sm font-medium text-white hover:bg-panel-accent-hover"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
