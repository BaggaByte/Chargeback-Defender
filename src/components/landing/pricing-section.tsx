'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Zap } from 'lucide-react';

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      id: 'performance',
      name: 'PERFORMANCE',
      tagline: 'Pay purely on recovery success.',
      badge: 'Zero Risk',
      pricing: '15%',
      subtext: 'of recovered dispute revenue ($0 fixed fee)',
      description: 'Ideal for growing merchants seeking fully aligned performance incentives.',
      features: [
        'Pay only on confirmed won chargebacks',
        'Multi-source evidence harvesting (Stripe, Shopify)',
        'Visa CE 3.0 & Mastercard compliance rules',
        'Automated PDF rebuttal generation',
        'Analyst review & approval portal',
      ],
      highlight: false,
      ctaText: 'Start with Performance',
    },
    {
      id: 'per_dispute',
      name: 'PER DISPUTE',
      tagline: 'Predictable flat rate per case.',
      badge: 'Most Popular',
      pricing: billingCycle === 'annual' ? '$15' : '$19',
      subtext: 'per compiled & submitted dossier',
      description: 'The standard choice for mid-market merchants with steady chargeback volume.',
      features: [
        'Everything in Performance tier',
        'Unlimited gateway and carrier connectors',
        'Sub-second webhook triage & ingestion',
        'Priority courier GPS & signature retrieval',
        'Full SOC 2 exportable evidence archives',
        'Slack & Webhook urgent SLA notifications',
      ],
      highlight: true,
      ctaText: 'Start Free Trial',
    },
    {
      id: 'enterprise',
      name: 'ENTERPRISE',
      tagline: 'Custom volume & dedicated engineering.',
      badge: 'Volume SLA',
      pricing: 'Custom',
      subtext: 'custom volume tiering & SLA guarantee',
      description: 'Engineered for high-volume enterprise merchants, marketplaces, and payment facilitators.',
      features: [
        'Everything in Per Dispute plan',
        'Dedicated Risk Engineering partner',
        'Custom internal database & ERP connectors',
        'Guaranteed 1-hour submission SLA',
        'SSO & multi-entity RBAC permissions',
        'Custom card brand legal citations',
      ],
      highlight: false,
      ctaText: 'Contact Enterprise Team',
    },
  ];

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-[#0b0f19] border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>TRANSPARENT PRICING</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Simple, value-aligned pricing plans.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Choose between paying purely on recovery success or a fixed flat fee per dispute dossier.
          </p>

          {/* Billing Switch */}
          <div className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs pt-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
                plan.highlight
                  ? 'bg-[#10172a] border-2 border-blue-500 shadow-md'
                  : 'bg-[#0e1320] border border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-mono font-bold text-xs text-white tracking-wider">
                      {plan.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 text-slate-300 border border-slate-800">
                      {plan.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{plan.tagline}</p>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold font-mono text-white tracking-tight">
                      {plan.pricing}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">{plan.subtext}</p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{plan.description}</p>

                {/* Features List */}
                <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs">
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span className="text-slate-300 leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <Link
                  href="/"
                  className={`w-full py-3 rounded-lg font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors ${
                    plan.highlight
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
