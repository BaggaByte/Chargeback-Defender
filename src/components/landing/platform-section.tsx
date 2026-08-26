'use client';

import React from 'react';
import {
  CreditCard,
  Truck,
  Globe,
  ShoppingBag,
  LifeBuoy,
  ArrowRight,
  Gauge,
  FileCheck2,
  History,
  Bell,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from './fade-in';

const evidenceSources = [
  { icon: CreditCard, name: 'Payments', detail: 'Auth records · AVS/CVV · 3DS tokens' },
  { icon: Truck, name: 'Logistics', detail: 'POD · signatures · GPS coordinates' },
  { icon: Globe, name: 'Sessions', detail: 'Device ID · IP history · login logs' },
  { icon: ShoppingBag, name: 'Commerce', detail: 'Orders · terms acceptance · usage' },
  { icon: LifeBuoy, name: 'Support', detail: 'Tickets · refund history · correspondence' },
];

export function PlatformSection() {
  return (
    <section id="platform" className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <FadeIn delay={0.1} direction="up" className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            The platform
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            One system of record for every dispute.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-600 sm:text-lg">
            Purpose-built infrastructure for evidence collection, network-rule compliance, and
            controlled submission — designed with the rigor your processor and acquirer expect.
          </p>
        </FadeIn>

        <StaggerContainer delayOffset={0.2} className="mt-12 grid gap-5 lg:grid-cols-12">
          {/* Evidence engine — large card */}
          <StaggerItem className="lg:col-span-7">
            <div className="h-full rounded-xl border border-ink-200 bg-white p-7 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
              <h3 className="text-lg font-semibold tracking-tight text-ink-900">Evidence engine</h3>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-600">
                Five evidence sources are correlated into a single dossier per dispute — the difference
                between a generic template and a representment that satisfies network requirements.
              </p>

              <div className="mt-6 space-y-2.5">
                {evidenceSources.map((source) => (
                  <div
                    key={source.name}
                    className="flex items-center gap-3.5 rounded-lg border border-ink-200 bg-ink-50/60 px-3.5 py-2.5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white ring-1 ring-inset ring-ink-200">
                      <source.icon className="h-4 w-4 text-ink-600" />
                    </span>
                    <div className="flex min-w-0 flex-1 items-baseline justify-between gap-4">
                      <span className="text-sm font-medium text-ink-900">{source.name}</span>
                      <span className="truncate text-xs text-ink-500">{source.detail}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                  </div>
                ))}
                <div className="flex items-center justify-center rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-3 text-sm font-medium text-brand-800">
                  Compiled dispute dossier — scored &amp; submission-ready
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Rule intelligence */}
          <StaggerItem className="lg:col-span-5">
            <div className="flex h-full flex-col rounded-xl border border-ink-200 bg-white p-7 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
              <h3 className="text-lg font-semibold tracking-tight text-ink-900">
                Network rule intelligence
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Every dossier is evaluated against the current dispute rules for Visa, Mastercard, and
                American Express — including Compelling Evidence 3.0 qualification.
              </p>

              <div className="mt-6 flex-1 rounded-lg border border-ink-200">
                <div className="border-b border-ink-200 bg-ink-50 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-ink-500">
                  CE 3.0 qualification — CB-99421
                </div>
                <ul className="divide-y divide-ink-100 px-4 py-2 text-xs">
                  {[
                    ['Two prior undisputed transactions', true],
                    ['Same device fingerprint or IP address', true],
                    ['Transactions within past 120 days', true],
                    ['AVS match on prior transactions', true],
                  ].map(([label, ok]) => (
                    <li key={String(label)} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-ink-700">{label}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          ok
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                            : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200'
                        }`}
                      >
                        {ok ? 'Met' : 'Missing'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-4 text-xs text-ink-500">
                Rules are maintained as networks publish updates — no engineering work on your side.
              </p>
            </div>
          </StaggerItem>

          {/* Bottom row — 3 compact capability cards */}
          <StaggerItem className="lg:col-span-4">
            <div className="h-full rounded-xl border border-ink-200 bg-white p-6 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 ring-1 ring-inset ring-brand-100">
                <Gauge className="h-4.5 w-4.5 text-brand-700" />
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-ink-900">
                Autopilot with guardrails
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Set a confidence threshold — cases above it submit automatically, the rest queue for
                human review with a recommended disposition and rationale.
              </p>
            </div>
          </StaggerItem>

          <StaggerItem className="lg:col-span-4">
            <div className="h-full rounded-xl border border-ink-200 bg-white p-6 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 ring-1 ring-inset ring-brand-100">
                <Bell className="h-4.5 w-4.5 text-brand-700" />
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-ink-900">
                Deadline-critical scheduling
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Response windows differ by network and processor. Every case is tracked against its
                actual deadline, with escalation well before a response lapses.
              </p>
            </div>
          </StaggerItem>

          <StaggerItem className="lg:col-span-4">
            <div className="h-full rounded-xl border border-ink-200 bg-white p-6 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 ring-1 ring-inset ring-brand-100">
                <History className="h-4.5 w-4.5 text-brand-700" />
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-ink-900">
                Immutable audit trail
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Every retrieval, score, edit, approval, and submission is recorded in an append-only
                log — exportable for acquirer reviews and compliance audits.
              </p>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Closing link */}
        <div className="mt-10 flex items-center gap-2 text-sm font-medium text-brand-700">
          <FileCheck2 className="h-4 w-4" />
          <span className="text-ink-600">
            Built for teams that answer to acquirers, auditors, and card networks.
          </span>
        </div>
      </div>
    </section>
  );
}
