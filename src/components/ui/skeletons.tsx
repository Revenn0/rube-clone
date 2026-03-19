'use client';

import { cn } from '@/lib/utils';

export function ChatSkeleton() {
  return (
    <div className="flex h-full flex-col animate-pulse">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="h-7 w-64 bg-muted rounded-lg mx-auto mb-3" />
          <div className="h-4 w-48 bg-muted rounded mx-auto mb-8" />
          <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-16 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border p-4">
        <div className="h-11 bg-muted rounded-xl max-w-2xl mx-auto" />
      </div>
    </div>
  );
}

export function AppGridSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-24 bg-muted rounded" />
        <div className="h-9 w-48 bg-muted rounded-lg" />
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="h-14 w-14 bg-muted rounded-2xl mb-3" />
            <div className="h-4 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkflowListSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-9 w-40 bg-muted rounded-lg" />
      {[1,2,3].map(i => (
        <div key={i} className="h-20 bg-muted rounded-xl" />
      ))}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="p-3 space-y-2 animate-pulse">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-10 bg-muted rounded-lg" />
      ))}
    </div>
  );
}

export function ProjectsSkeleton() {
  return (
    <div className="min-h-full flex flex-col animate-pulse">
      <div className="border-b border-border px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-muted rounded-lg" />
          <div className="h-9 w-28 bg-muted rounded-lg" />
        </div>
      </div>
      <div className="flex-1 p-4 sm:p-6 space-y-4">
        <div className="rounded-xl border border-border p-4">
          <div className="h-4 w-16 bg-muted rounded mb-3" />
          <div className="space-y-1">
            {[1,2,3].map(i => (
              <div key={i} className="h-8 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
        {[1,2].map(i => (
          <div key={i} className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-3 w-3 rounded-full bg-muted" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
            <div className="space-y-1">
              <div className="h-8 bg-muted rounded-lg" />
              <div className="h-8 bg-muted rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="min-h-full flex animate-pulse">
      <div className="w-64 shrink-0 border-r border-border p-4">
        <div className="h-6 w-24 bg-muted rounded mb-4" />
        <div className="space-y-1">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-9 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <div className="h-8 w-48 bg-muted rounded mb-6" />
        <div className="space-y-4"> 
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
            <div className="h-4 w-full bg-muted rounded-full" />
        </div>
      </div>
    </div>
  );
}
