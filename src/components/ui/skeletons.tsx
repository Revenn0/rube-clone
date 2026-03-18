'use client';

import { cn } from '@/lib/utils';

export function ChatSkeleton() {
  return (
    <div className="flex h-full flex-col animate-pulse">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="h-7 w-64 bg-[#f3f4f6] rounded-lg mx-auto mb-3" />
          <div className="h-4 w-48 bg-[#f3f4f6] rounded mx-auto mb-8" />
          <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-16 bg-[#f3f4f6] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-[#e5e7eb] p-4">
        <div className="h-11 bg-[#f3f4f6] rounded-xl max-w-2xl mx-auto" />
      </div>
    </div>
  );
}

export function AppGridSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-24 bg-[#f3f4f6] rounded" />
        <div className="h-9 w-48 bg-[#f3f4f6] rounded-lg" />
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="h-14 w-14 bg-[#f3f4f6] rounded-2xl mb-3" />
            <div className="h-4 w-16 bg-[#f3f4f6] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkflowListSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-9 w-40 bg-[#f3f4f6] rounded-lg" />
      {[1,2,3].map(i => (
        <div key={i} className="h-20 bg-[#f3f4f6] rounded-xl" />
      ))}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="p-3 space-y-2 animate-pulse">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-10 bg-[#f3f4f6] rounded-lg" />
      ))}
    </div>
  );
}
