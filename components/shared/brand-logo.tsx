import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

export function BrandLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return <Image src="/images/holznest-logo-v2.png" alt="HolzNest" width={1448} height={1086} unoptimized loading={priority ? "eager" : "lazy"} className={cn('h-auto w-24 shrink-0 rounded-sm object-contain sm:w-28', className)} />;
}
