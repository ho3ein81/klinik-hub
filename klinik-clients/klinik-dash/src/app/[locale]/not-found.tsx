import Link from 'next/link';
import type { Route } from 'next';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <h2 className="text-4xl font-bold text-primary">404</h2>
      <p className="mt-2 text-lg font-medium text-text-main">
        Seite nicht gefunden / Page not found
      </p>
      <p className="mt-1 text-sm text-text-muted">
        The requested resource could not be found.
      </p>
      <Link
        href={'/' as Route}
        className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
      >
        Zurück zum Dashboard
      </Link>
    </div>
  );
}
