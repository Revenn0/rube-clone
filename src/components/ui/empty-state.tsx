import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  onClick?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  onClick,
  className,
}: EmptyStateProps) {
  const content = (
    <>
      <div className="flex justify-center text-muted-foreground mb-4">{icon}</div>
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
        >
          {action.label}
        </button>
      )}
    </>
  );

  const baseClass =
    'rounded-xl border border-border bg-muted p-12 text-center flex flex-col items-center justify-center';

  if (onClick) {
    return (
      <div
        onClick={onClick}
        className={cn(
          baseClass,
          'cursor-pointer hover:border-border hover:bg-card-hover transition-colors',
          className
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <div className={cn(baseClass, className)}>
      {content}
    </div>
  );
}
