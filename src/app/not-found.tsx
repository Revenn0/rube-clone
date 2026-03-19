'use client';

import Link from 'next/link';
import { Flame, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center text-center max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-12">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-brand">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold text-foreground">Jungor</span>
        </Link>

        <p className="text-sm font-medium text-brand mb-2 tracking-wide uppercase">404</p>
        <h1 className="text-2xl font-semibold text-foreground mb-3">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          href="/chat"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jungor
        </Link>
      </div>
    </div>
  );
}
