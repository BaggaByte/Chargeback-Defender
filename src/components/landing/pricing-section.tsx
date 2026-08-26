'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from './fade-in';

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      id: 'performance',
      name: 'Performance',
      price: '15%',
      unit: 'of recovered revenue',
      description: 'Fully aligned pricing — you pay only on disputes we win back for you.',
      features: [
        'No platform fee or minimum commitment',
        'Multi-source evidence collection',
        'Network rule engine — Visa, Mastercard, Amex',
        'Automated rebuttal drafting',
        'Approval portal for your team',
      ],
      cta: 'Talk to sales',
      highlight: false,
    },
    {
      id: 'scale',
      name: 'Scale',
      price: annual ? '$15' : '$19',
      unit: annual ? 'per dispute, billed annually' : 'per dispute, billed monthly',
      description: 'Flat per-dispute pricing for merchants with predictable dispute volume.',
      features: [
        'Everything in Performance',
        'Unlimited connectors and data sources',
        'Autopilot thresholds and approval routing',
        'Priority evidence retrieval SLAs',
        'Slack and webhook alerting',
        'Exportable evidence archives',
      ],
      cta: 'Start evaluating',
      highlight: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      unit: 'volume tiers & dedicated support',
      description: 'For marketplaces, payment facilitators, and multi-entity organizations.',
      features: [
        'Everything in Scale',
        'SSO (SAML), SCIM, and multi-entity RBAC',
        'Custom ERP and internal-system connectors',
        'Guaranteed submission SLAs',
        'Named risk-engineering partner',
        'US or EU data residency',
      ],
      cta: 'Contact sales',
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <FadeIn delay={0.1} direction="up" className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Straightforward plans, aligned to outcomes.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-600 sm:text-lg">
            Every plan includes the full evidence engine. No per-seat charges, no implementation
            fees.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center rounded-lg border border-ink-200 bg-ink-50 p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                !annual ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                annual ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              Annual
              <span className="ml-1.5 text-xs text-brand-700">−20%</span>
            </button>
          </div>
        </FadeIn>

        <StaggerContainer delayOffset={0.2} className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <StaggerItem
              key={plan.id}
              className={`relative flex h-full flex-col rounded-xl p-7 ${
                plan.highlight
                  ? 'border-2 border-ink-900 bg-white shadow-[0_12px_32px_-12px_rgb(15_23_42/0.2)]'
                  : 'border border-ink-200 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04)]'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-ink-900 px-3 py-1 text-[11px] font-medium text-white">
                  Most widely adopted
                </span>
              )}

              <h3 className="text-lg font-semibold tracking-tight text-ink-900">{plan.name}</h3>
              <p className="mt-1.5 min-h-10 text-sm leading-relaxed text-ink-600">
                {plan.description}
              </p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight text-ink-900 tabular-nums">
                  {plan.price}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-500">{plan.unit}</p>

              <ul className="mt-7 flex-1 space-y-3 border-t border-ink-100 pt-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-ink-700">
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        plan.highlight ? 'text-brand-700' : 'text-ink-400'
                      }`}
                      strokeWidth={2.5}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.id === 'enterprise' ? 'mailto:sales@chargebackdefender.com' : '/login'}
                className={`mt-8 inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                  plan.highlight
                    ? 'bg-ink-900 text-white hover:bg-ink-800'
                    : 'border border-ink-300 bg-white text-ink-700 hover:bg-ink-50'
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <p className="mt-10 text-center text-xs text-ink-500">
          Performance plan fees apply only to disputes resolved in your favor. Volume tiers for
          500+ monthly disputes are available on request.
        </p>
      </div>
    </section>
  );
}
