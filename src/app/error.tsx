'use client';

import Link from 'next/link';
import { Flame, AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center bg-background px-6 font-sans">
        <div className="flex flex-col items-center text-center max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-brand">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold text-foreground">Jungor</span>
          </Link>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 mb-5">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>

          <h1 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            An unexpected error occurred. Our team has been notified. Please try again or contact{' '}
            <a href="mailto:support@jungor.dev" className="text-brand hover:underline">
              support@jungor.dev
            </a>{' '}
            if the issue persists.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
