import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

export function BrandLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return <Image src="/images/holznest-logo-transparent.png" alt="HolzNest" width={577} height={433} unoptimized loading={priority ? "eager" : "lazy"} className={cn('h-auto w-24 shrink-0 rounded-sm object-contain sm:w-28', className)} />;
}
