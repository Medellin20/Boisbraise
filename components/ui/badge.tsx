import * as React from 'react';
import { cn } from '@/lib/utils/cn';

type BadgeVariant = 'default' | 'available' | 'reserved' | 'rented' | 'new' | 'outline';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-ink-100 text-ink-700',
  available: 'bg-canal-50 text-canal-700 ring-1 ring-inset ring-canal-200',
  reserved: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  rented: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200',
  new: 'bg-brick-50 text-brick-600 ring-1 ring-inset ring-brick-200',
  outline: 'bg-white/90 text-ink-700 ring-1 ring-inset ring-ink-200 backdrop-blur-sm',
};

export function Badge({
  variant = 'default',
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusDot({ colorClass }: { colorClass: string }) {
  return <span className={cn('inline-block h-2 w-2 rounded-full', colorClass)} />;
}
