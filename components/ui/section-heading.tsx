import { cn } from '@/lib/utils/cn';

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div className={cn(align === 'center' && 'text-center', className)}>
      {eyebrow && (
        <span className="text-eyebrow uppercase text-canal-600">{eyebrow}</span>
      )}
      <h2 className="mt-2 text-display-sm text-ink-900 sm:text-display-md">{title}</h2>
      {description && (
        <p className={cn('mt-3 max-w-2xl text-ink-500', align === 'center' && 'mx-auto')}>
          {description}
        </p>
      )}
    </div>
  );
}
