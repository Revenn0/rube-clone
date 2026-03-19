'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, CreditCard } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isLimitError = error.message?.includes('402') || error.message?.toLowerCase().includes('limit') || error.message?.toLowerCase().includes('quota');

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      {isLimitError ? (
        <div className="rounded-xl border border-border bg-card p-6 max-w-sm w-full text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Usage limit reached</h2>
          <p className="text-sm text-muted-foreground mb-6">
            You&apos;ve reached your plan&apos;s usage limit. Upgrade to continue using Jungor.
          </p>
          <Link href="/settings?tab=billing">
            <Button className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Upgrade plan
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
            {error.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={reset} variant="default" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </>
      )}
    </div>
  );
}
