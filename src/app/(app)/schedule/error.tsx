'use client';

import Link from 'next/link';
import { AlertTriangle, RefreshCw, CreditCard } from 'lucide-react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isLimitError =
    error.message?.includes('402') ||
    error.message?.toLowerCase().includes('limit') ||
    error.message?.toLowerCase().includes('quota');

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      {isLimitError ? (
        <div className="rounded-xl border border-border bg-card p-8 max-w-sm w-full text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 mx-auto mb-5">
            <CreditCard className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Usage limit reached</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            You&apos;ve reached your plan&apos;s usage limit. Upgrade to continue using Jungor.
          </p>
          <Link
            href="/settings?tab=billing"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            Upgrade plan
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 mb-5">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {error.message || 'An unexpected error occurred. Please try again.'}
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
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
