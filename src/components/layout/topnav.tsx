'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Flame, Plus } from 'lucide-react';

const navItems = [
  { href: '/chat', label: 'Chat' },
  { href: '/workflows', label: 'Workflows' },
  { href: '/apps', label: 'Apps' },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[#e5e7eb] bg-white px-6">
      {/* Logo */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f26522]">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold text-[#0a0a0a]">rube</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  isActive
                    ? 'bg-[#f3f4f6] text-[#0a0a0a] font-medium'
                    : 'text-[#6b7280] hover:text-[#0a0a0a] hover:bg-[#f9fafb]'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Add button */}
      <button className="flex items-center gap-1.5 rounded-full bg-[#ef4444] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#dc2626] transition-colors">
        <Plus className="h-4 w-4" />
        Add
      </button>
    </header>
  );
}
