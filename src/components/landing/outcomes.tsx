'use client';

import React from 'react';

const metrics = [
  { value: '3.2×', label: 'Median lift in win rate after switching from manual handling' },
  { value: '68%', label: 'Average reduction in analyst hours spent per dispute' },
  { value: '< 3 min', label: 'From dispute webhook to fully compiled evidence dossier' },
  { value: '100%', label: 'Response deadlines met across all managed disputes' },
];

export function Outcomes() {
  return (
    <section className="relative overflow-hidden bg-ink-900">
      {/* Subtle topography */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:56px_56px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(50%_60%_at_50%_0%,rgba(37,87,235,0.35)_0%,transparent_70%)]"
      />

      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-300">
            Outcomes
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Operational results, measured across customer deployments.
          </h2>
        </div>

        <dl className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.value} className="bg-ink-900/95 px-7 py-8">
              <dt className="order-2 mt-3 block text-sm leading-relaxed text-ink-300">
                {metric.label}
              </dt>
              <dd className="order-1 text-4xl font-semibold tracking-tight text-white">
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Testimonial */}
        <figure className="mx-auto mt-16 max-w-3xl text-center">
          <blockquote className="text-lg font-medium leading-relaxed text-ink-100 sm:text-xl">
            &ldquo;We stopped triaging disputes in spreadsheets. The platform compiles a stronger
            evidence file than we ever assembled by hand — and it has never missed a response
            deadline.&rdquo;
          </blockquote>
          <figcaption className="mt-5 text-sm text-ink-400">
            <span className="font-medium text-ink-200">Elena Marsh</span> · VP, Payments Operations
            — Northwind Commerce
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
