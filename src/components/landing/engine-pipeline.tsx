'use client';

import React, { useState } from 'react';
import {
  Webhook,
  Search,
  Scale,
  Activity,
  FileCheck2,
  Send,
  ChevronRight,
  Clock,
} from 'lucide-react';

export function EnginePipeline() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      number: '01',
      title: 'Real-Time Ingestion',
      category: 'DETECTION',
      icon: <Webhook className="w-5 h-5 text-blue-400" />,
      duration: '&lt; 150ms',
      description: 'Webhook listeners ingest dispute payloads instantly across Stripe, Shopify, Braintree, and Adyen.',
      details: 'Extracts reason code, card brand (Visa/MC/Amex), dispute amount, and settlement currency.',
    },
    {
      number: '02',
      title: 'Multi-Source Retrieval',
      category: 'HARVESTING',
      icon: <Search className="w-5 h-5 text-emerald-400" />,
      duration: '~1.8s',
      description: 'Asynchronously queries carrier APIs, order databases, helpdesk records, and device logs.',
      details: 'Pulls proof-of-delivery signatures, GPS delivery stamps, itemized invoices, and customer communications.',
    },
    {
      number: '03',
      title: 'Card Network Rulebook Match',
      category: 'COMPLIANCE',
      icon: <Scale className="w-5 h-5 text-indigo-400" />,
      duration: '~400ms',
      description: 'Applies precise scheme rules: Visa CE 3.0 Compelling Evidence, Mastercard 4837/4853 standards.',
      details: 'Identifies matching prior transactions, device IDs, and 3DS authentication tokens to force liability shift.',
    },
    {
      number: '04',
      title: 'Algorithmic Strength Score',
      category: 'SCORING',
      icon: <Activity className="w-5 h-5 text-amber-400" />,
      duration: '~200ms',
      description: 'Calculates win probability on a 0–100 scale using calibrated historical outcome data.',
      details: 'Exhibits are individually weighted (+30 for carrier signature, +25 for CE 3.0 prior transactions, etc.).',
    },
    {
      number: '05',
      title: 'Rebuttal Dossier Synthesis',
      category: 'SYNTHESIS',
      icon: <FileCheck2 className="w-5 h-5 text-cyan-400" />,
      duration: '~1.2s',
      description: 'Compiles a standardized, court-ready representment memo citing specific network operating regulations.',
      details: 'Packages signed exhibits, terms of service clickwrap proof, and itemized customer transaction ledgers.',
    },
    {
      number: '06',
      title: 'Gateway API Submission',
      category: 'SUBMISSION',
      icon: <Send className="w-5 h-5 text-blue-400" />,
      duration: '&lt; 800ms',
      description: 'Transmits compiled PDF and evidence tokens directly to your merchant gateway before SLA deadlines.',
      details: 'Maintains complete cryptographic audit trails and notifies your Slack/Email channels on resolution.',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-[#0e1320] border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            <span>AUTOMATED LIFECYCLE</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            The 6-stage autonomous recovery engine.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            From the millisecond a chargeback webhook hits our infrastructure to bank representment, the entire evidence assembly workflow executes autonomously.
          </p>
        </div>

        {/* 6 Stage Horizontal / Grid Flow */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map((step, index) => (
            <div
              key={step.number}
              onClick={() => setActiveStep(index)}
              className={`p-6 rounded-xl border transition-all cursor-pointer space-y-4 ${
                activeStep === index
                  ? 'bg-[#131b2e] border-blue-500 shadow-sm'
                  : 'bg-[#090d16] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400">{step.number}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  {step.category}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  {step.icon}
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">{step.title}</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {step.description}
              </p>

              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                {step.details}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
