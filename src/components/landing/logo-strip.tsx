'use client';

import React from 'react';

const logos = [
  { name: 'NORTHWIND', style: 'font-semibold tracking-[0.22em] text-[15px]' },
  { name: 'vellum', style: 'font-medium italic text-[19px] tracking-tight' },
  { name: 'Arbor & Co', style: 'font-serif text-[18px] font-medium' },
  { name: 'PORTSIDE', style: 'font-bold tracking-[0.18em] text-[14px]' },
  { name: 'Helios Labs', style: 'font-medium text-[18px] tracking-tight' },
  { name: 'Marlowe', style: 'font-serif italic text-[18px]' },
];

export function LogoStrip() {
  return (
    <section className="border-y border-ink-200 bg-ink-50">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <p className="text-center text-xs font-medium uppercase tracking-[0.14em] text-ink-500">
          Trusted by dispute and payments teams at
        </p>
        <div className="mt-6 grid grid-cols-2 items-center justify-items-center gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          {logos.map((logo) => (
            <span
              key={logo.name}
              className={`select-none text-ink-400 transition-colors hover:text-ink-600 ${logo.style}`}
            >
              {logo.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
