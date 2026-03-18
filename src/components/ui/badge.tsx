import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-[#262626] text-[#a3a3a3]': variant === 'default',
          'bg-emerald-500/10 text-emerald-400': variant === 'success',
          'bg-amber-500/10 text-amber-400': variant === 'warning',
          'bg-red-500/10 text-red-400': variant === 'error',
        },
        className
      )}
      {...props}
    />
  );
}
