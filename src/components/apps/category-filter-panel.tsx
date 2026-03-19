'use client';

import {
  Store,
  Bookmark,
  Code2,
  Users,
  Bot,
  Folder,
  BarChart3,
  Building2,
  LineChart,
  Music,
  Zap,
  GraduationCap,
  Palette,
  Megaphone,
  Calendar,
  ShoppingCart,
  DollarSign,
  Shield,
  LayoutGrid,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CANONICAL_CATEGORIES,
  ALL_CATEGORY,
  CATEGORY_ICONS,
} from '@/lib/app-categories';

const ICON_MAP: Record<string, LucideIcon> = {
  Store,
  Bookmark,
  Code2,
  Users,
  Bot,
  Folder,
  BarChart3,
  Building2,
  LineChart,
  Music,
  Zap,
  GraduationCap,
  Palette,
  Megaphone,
  Calendar,
  ShoppingCart,
  DollarSign,
  Shield,
  LayoutGrid,
};

interface CategoryFilterPanelProps {
  value: string;
  onChange: (category: string) => void;
  counts?: Record<string, number>;
  className?: string;
}

export function CategoryFilterPanel({ value, onChange, counts, className }: CategoryFilterPanelProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col max-h-[min(70vh,420px)]',
        className
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground px-3 pt-3 pb-2 shrink-0">
        Filter by category
      </p>
      <div className="overflow-y-auto flex-1 px-1.5 pb-2 space-y-0.5">
        {CANONICAL_CATEGORIES.map((cat) => {
          const iconName = CATEGORY_ICONS[cat] ?? 'LayoutGrid';
          const Icon = ICON_MAP[iconName] ?? LayoutGrid;
          const selected = value === cat;
          const count = counts?.[cat];
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onChange(cat)}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm transition-colors',
                selected ? 'bg-muted text-foreground' : 'text-foreground hover:bg-muted/60'
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                <Icon className="h-4 w-4 text-foreground" strokeWidth={1.5} />
              </span>
              <span className="flex-1 min-w-0 truncate font-medium">{cat}</span>
              {count != null && count > 0 && (
                <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
              )}
              {selected && <Check className="h-4 w-4 shrink-0 text-foreground" strokeWidth={2} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { ALL_CATEGORY };
