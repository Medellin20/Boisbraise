import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative min-w-0 max-w-full">
        <select
          ref={ref}
          className={cn(
            'h-11 w-full min-w-0 max-w-full appearance-none rounded-xl border bg-white px-3.5 pr-9 text-base text-ink sm:text-sm',
            'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ink-700/30 focus:border-ink-700',
            error ? 'border-brick-500' : 'border-ink-200',
            'disabled:bg-sand-100 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      </div>
    );
  }
);
Select.displayName = 'Select';
