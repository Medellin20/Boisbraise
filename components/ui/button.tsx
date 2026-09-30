import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brick-500 text-white hover:bg-brick-600 active:bg-brick-700 shadow-soft',
  secondary: 'bg-canal-600 text-white hover:bg-canal-700 active:bg-canal-800 shadow-soft',
  outline: 'border border-ink-200 text-ink-700 bg-white hover:bg-sand-100 active:bg-sand-200',
  ghost: 'text-ink-700 hover:bg-ink-50 active:bg-ink-100',
  destructive: 'bg-brick-500 text-white hover:bg-brick-600 active:bg-brick-700 shadow-soft',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3.5 py-2 text-sm rounded-lg gap-1.5',
  md: 'min-h-11 px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'min-h-13 px-5 py-3 sm:px-7 text-base rounded-xl gap-2',
  icon: 'h-11 w-11 shrink-0 rounded-full',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, asChild = false, type, ...props }, ref) => {
    const sharedClassName = cn(
          'inline-flex max-w-full items-center justify-center whitespace-normal text-center leading-snug font-semibold [&>svg]:shrink-0 transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-700 focus-visible:ring-offset-2',
          'active:scale-[0.98]',
          variantClasses[variant],
          sizeClasses[size],
          className
        );

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ...props,
        className: cn(sharedClassName, (children.props as any).className),
        'aria-disabled': disabled || isLoading || undefined,
      });
    }

    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        disabled={disabled || isLoading}
        className={sharedClassName}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
