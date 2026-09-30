import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full min-w-0 max-w-full rounded-xl border bg-white px-3.5 py-3 text-base text-ink sm:text-sm placeholder:text-ink-400',
          'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ink-700/30 focus:border-ink-700',
          error ? 'border-brick-500' : 'border-ink-200',
          'disabled:bg-sand-100 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
