'use client';

import React from 'react';
import { motion } from 'framer-motion';

const logos = [
  { name: 'NORTHWIND', style: 'font-semibold tracking-[0.22em] text-[15px]' },
  { name: 'vellum', style: 'font-medium italic text-[19px] tracking-tight' },
  { name: 'Arbor & Co', style: 'font-serif text-[18px] font-medium' },
  { name: 'PORTSIDE', style: 'font-bold tracking-[0.18em] text-[14px]' },
  { name: 'Helios Labs', style: 'font-medium text-[18px] tracking-tight' },
  { name: 'Marlowe', style: 'font-serif italic text-[18px]' },
];

export function LogoStrip() {
  const marqueeLogos = [...logos, ...logos, ...logos, ...logos];

  return (
    <section className="overflow-hidden border-y border-ink-200 bg-ink-50">
      <div className="mx-auto max-w-7xl py-10">
        <p className="px-6 text-center text-xs font-medium uppercase tracking-[0.14em] text-ink-500">
          Trusted by dispute and payments teams at
        </p>
        <div className="relative mt-8 flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <motion.div
            className="flex w-max flex-none items-center gap-16 pr-16"
            animate={{ x: '-50%' }}
            transition={{
              repeat: Infinity,
              ease: 'linear',
              duration: 30,
            }}
          >
            {marqueeLogos.map((logo, i) => (
              <span
                key={`${logo.name}-${i}`}
                className={`select-none whitespace-nowrap text-ink-400 transition-colors hover:text-ink-600 ${logo.style}`}
              >
                {logo.name}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
