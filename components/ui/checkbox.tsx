import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            'peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-ink-300 bg-white',
            'checked:border-ink-700 checked:bg-ink-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-700/30',
            'transition-colors',
            className
          )}
          {...props}
        />
        <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" />
      </span>
    );
  }
);
Checkbox.displayName = 'Checkbox';
