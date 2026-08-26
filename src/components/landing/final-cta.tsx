'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FadeIn } from './fade-in';

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-ink-800 bg-ink-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(55%_80%_at_50%_100%,rgba(37,87,235,0.3)_0%,transparent_70%)]"
      />
      <FadeIn delay={0.1} direction="up" className="relative mx-auto max-w-7xl px-6 py-20 text-center lg:px-8 lg:py-24">
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Your next dispute can be the first one your team doesn&apos;t assemble by hand.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-300">
          Connect a processor and watch a real dispute compile end to end. Evaluations run on live
          data with read-only access — typically provisioned in under a day.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-medium text-ink-900 shadow-sm transition-colors hover:bg-ink-100"
          >
            Start evaluating
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="mailto:sales@chargebackdefender.com"
            className="inline-flex items-center justify-center rounded-md border border-white/20 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5"
          >
            Talk to sales
          </a>
        </div>
        <p className="mt-6 text-xs text-ink-500">
          Typical response within one business day · No card required
        </p>
      </FadeIn>
    </section>
  );
}
