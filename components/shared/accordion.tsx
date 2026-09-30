'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function Accordion({ items }: { items: { question: string; answer: string }[] }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <div className="divide-y divide-ink-100 rounded-2xl border border-ink-100 bg-white">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.question}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-ink-900">{item.question}</span>
              <ChevronDown
                className={cn('h-4.5 w-4.5 shrink-0 text-ink-400 transition-transform duration-200', isOpen && 'rotate-180')}
              />
            </button>
            <div
              className={cn(
                'grid overflow-hidden transition-all duration-300 ease-in-out',
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-sm leading-relaxed text-ink-500 sm:px-6">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
