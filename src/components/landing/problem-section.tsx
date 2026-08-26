'use client';

import React from 'react';
import { TimerOff, Scissors, TrendingDown } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from './fade-in';

const costs = [
  {
    icon: TimerOff,
    stat: '45–90 min',
    label: 'of analyst time per dispute',
    detail:
      'Evidence lives across four to six disconnected systems. Assembling it manually makes most low-value disputes uneconomical to fight at all.',
  },
  {
    icon: Scissors,
    stat: '$15–100',
    label: 'in fees per dispute, win or lose',
    detail:
      'Processor dispute fees, network assessments, and operational overhead accrue on every case — and lost disputes add the full face value on top.',
  },
  {
    icon: TrendingDown,
    stat: '0.9%',
    label: 'dispute ratio threshold at Visa',
    detail:
      'Exceed network monitoring thresholds and you risk enrollment in dispute monitoring programs, higher reserve requirements, and processor termination.',
  },
];

export function ProblemSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <FadeIn delay={0.1} direction="up" className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            The cost of inaction
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Most disputes aren&apos;t lost on the merits. They&apos;re lost on logistics.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-600 sm:text-lg">
            A representment that arrives late, cites the wrong network rule, or omits one piece of
            corroborating evidence loses by default. The pattern is consistent — and avoidable.
          </p>
        </FadeIn>

        <StaggerContainer delayOffset={0.2} className="mt-12 grid gap-5 md:grid-cols-3">
          {costs.map((item) => (
            <StaggerItem key={item.stat}>
              <div
                className="h-full rounded-xl border border-ink-200 bg-white p-6 shadow-[0_1px_2px_rgb(15_23_42/0.04)]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 ring-1 ring-inset ring-brand-100">
                  <item.icon className="h-4.5 w-4.5 text-brand-700" />
                </div>
                <div className="mt-5 text-3xl font-semibold tracking-tight text-ink-900">
                  {item.stat}
                </div>
                <div className="mt-1 text-sm font-medium text-ink-700">{item.label}</div>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">{item.detail}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
