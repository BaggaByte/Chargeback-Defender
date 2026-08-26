'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Lock,
  ShieldCheck,
  FileText,
  Truck,
  CreditCard,
  UserCheck,
  Clock,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from './fade-in';

const evidenceRows = [
  {
    icon: Truck,
    label: 'Proof of delivery — FedEx 7738 2910 4',
    detail: 'Signed "M. Vance" · GPS match to billing address',
    points: '+30',
  },
  {
    icon: CreditCard,
    label: 'Authentication record — 3DS + full AVS/CVV match',
    detail: 'ECI 05 · Visa Directory Server verified',
    points: '+25',
  },
  {
    icon: UserCheck,
    label: 'Prior undisputed orders — 2 on the same card',
    detail: 'Qualifies under Visa CE 3.0 prior-transaction evidence',
    points: '+20',
  },
  {
    icon: FileText,
    label: 'Terms acceptance log — checkout clickwrap',
    detail: 'IP 198.51.100.42 · Terms v4.2 accepted at purchase',
    points: '+12',
  },
];

export function Hero() {
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'rebuttal'>('overview');

  return (
    <section className="relative overflow-hidden bg-white pt-16">
      {/* Subtle architectural backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_50%_at_75%_0%,#eef4ff_0%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 py-20 lg:grid-cols-12 lg:gap-10 lg:py-28">
          {/* Copy */}
          <StaggerContainer className="lg:col-span-5">
            <StaggerItem>
              <div className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-600 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
                Now supporting Visa Compelling Evidence 3.0 workflows
              </div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl">
                Recover more dispute revenue with complete evidence.
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-600 sm:text-lg">
                Chargeback Defender correlates payment records, delivery confirmation, and customer
                history into network-compliant representments — compiled automatically, before your
                response window closes.
              </p>
            </StaggerItem>

            <StaggerItem>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-ink-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink-800"
                >
                  Request a demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#platform"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-ink-300 bg-white px-5 py-3 text-sm font-medium text-ink-700 shadow-sm transition-colors hover:bg-ink-50"
                >
                  Explore the platform
                </a>
              </div>
            </StaggerItem>

            <StaggerItem>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-600">
                {['SOC 2 Type II', 'PCI DSS Level 1', 'GDPR-ready'].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-brand-700" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </StaggerItem>
          </StaggerContainer>

          {/* Product preview */}
          <div className="lg:col-span-7">
            <FadeIn delay={0.2} direction="up">
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute -inset-6 rounded-3xl bg-gradient-to-b from-brand-100/60 to-transparent opacity-70 blur-2xl"
                />
                <div className="relative overflow-hidden rounded-xl border border-ink-200 bg-white shadow-[0_24px_60px_-24px_rgb(15_23_42/0.25)]">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-3 border-b border-ink-200 bg-ink-50 px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-ink-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-ink-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-ink-300" />
                    </div>
                    <div className="flex flex-1 items-center justify-center">
                      <div className="flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-1 text-[11px] text-ink-500">
                        <Lock className="h-3 w-3" />
                        app.chargebackdefender.com/disputes/CB-99421
                      </div>
                    </div>
                    <div className="w-10" />
                  </div>

                  {/* App header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-ink-900">Dispute CB-99421</span>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                        Response required
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-ink-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Deadline in 7 days
                      </span>
                      <span className="font-semibold text-ink-900">$489.00</span>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 border-b border-ink-200 px-5 pt-3">
                    {(
                      [
                        ['overview', 'Overview'],
                        ['evidence', `Evidence (${evidenceRows.length})`],
                        ['rebuttal', 'Rebuttal draft'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`-mb-px border-b-2 px-3 pb-2.5 text-xs font-medium transition-colors ${
                          activeTab === id
                            ? 'border-brand-600 text-ink-900'
                            : 'border-transparent text-ink-500 hover:text-ink-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div className="px-5 py-5">
                    {activeTab === 'overview' && (
                      <div className="grid gap-4 sm:grid-cols-5">
                        <div className="rounded-lg border border-ink-200 bg-ink-50 p-4 sm:col-span-2">
                          <div className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
                            Evidence strength
                          </div>
                          <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-3xl font-semibold tracking-tight text-ink-900">92</span>
                            <span className="text-xs text-ink-500">/ 100</span>
                          </div>
                          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
                            <div className="h-full w-[92%] rounded-full bg-emerald-500" />
                          </div>
                          <div className="mt-2 text-[11px] font-medium text-emerald-600">
                            Strong — recommend auto-submit
                          </div>
                        </div>
                        <div className="space-y-3 sm:col-span-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg border border-ink-200 p-3">
                              <div className="text-[10px] font-medium uppercase tracking-wider text-ink-500">
                                Reason code
                              </div>
                              <div className="mt-1 text-sm font-semibold text-ink-900">10.4 Fraud</div>
                            </div>
                            <div className="rounded-lg border border-ink-200 p-3">
                              <div className="text-[10px] font-medium uppercase tracking-wider text-ink-500">
                                Network
                              </div>
                              <div className="mt-1 text-sm font-semibold text-ink-900">Visa</div>
                            </div>
                            <div className="rounded-lg border border-ink-200 p-3">
                              <div className="text-[10px] font-medium uppercase tracking-wider text-ink-500">
                                Processor
                              </div>
                              <div className="mt-1 text-sm font-semibold text-ink-900">Stripe</div>
                            </div>
                          </div>
                          <div className="rounded-lg border border-brand-200 bg-brand-50 p-3.5">
                            <div className="flex items-start gap-2.5">
                              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                              <p className="text-xs leading-relaxed text-ink-700">
                                Dossier qualifies under{' '}
                                <span className="font-medium text-ink-900">
                                  Visa Compelling Evidence 3.0
                                </span>{' '}
                                — two prior undisputed transactions share the same device ID and IP
                                address.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'evidence' && (
                      <div className="space-y-2">
                        {evidenceRows.map((row) => (
                          <div
                            key={row.label}
                            className="flex items-center justify-between gap-4 rounded-lg border border-ink-200 px-3.5 py-3"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-50 ring-1 ring-inset ring-ink-200">
                                <row.icon className="h-3.5 w-3.5 text-ink-600" />
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-xs font-medium text-ink-900">
                                  {row.label}
                                </div>
                                <div className="truncate text-[11px] text-ink-500">{row.detail}</div>
                              </div>
                            </div>
                            <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                              {row.points}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === 'rebuttal' && (
                      <div className="rounded-lg border border-ink-200">
                        <div className="border-b border-ink-200 bg-ink-50 px-4 py-2 text-[11px] font-medium text-ink-600">
                          Representment memo — CB-99421 · Draft generated, pending approval
                        </div>
                        <div className="space-y-3 px-4 py-4 text-xs leading-relaxed text-ink-700">
                          <p className="font-medium text-ink-900">
                            Re: Transaction ch_3Nk41q28 — $489.00 USD · Reason code 10.4
                          </p>
                          <p>
                            The merchant respectfully requests reversal of this chargeback. The
                            cardholder completed two prior undisputed transactions on the same payment
                            credential, from the same device and IP address, within the past 120 days
                            — satisfying the evidentiary requirements of Visa Compelling Evidence 3.0.
                          </p>
                          <p>
                            Merchandise was delivered to the cardholder&apos;s verified billing address
                            and signed for at the point of delivery. Attached exhibits A–D document
                            authentication, delivery, and terms acceptance in full.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer action bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 bg-ink-50 px-5 py-3">
                    <span className="flex items-center gap-1.5 text-[11px] text-ink-500">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      Evidence verified · SHA-256 checksums recorded to audit log
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-700 px-3 py-1.5 text-[11px] font-medium text-white">
                      Approve &amp; submit to Stripe
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
