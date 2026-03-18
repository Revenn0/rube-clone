'use client';

import { Input } from '@/components/ui/input';
import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header({ title }: { title: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[#262626] px-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]" />
          <Input placeholder="Search..." className="pl-9 h-9" />
        </div>
        <Button variant="ghost" size="sm">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
