import { cn } from '@/lib/utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-ink-100',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer',
        'before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent',
        className
      )}
    />
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}
