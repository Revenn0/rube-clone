'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 mb-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Something went wrong</h2>
      <p className="text-sm text-[#6b7280] mb-6 text-center max-w-sm">
        {error.message || 'An unexpected error occurred'}
      </p>
      <Button onClick={reset} variant="accent" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try again
      </Button>
    </div>
  );
}
