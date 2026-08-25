'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Shield } from 'lucide-react';

export function FinalCta() {
  return (
    <section className="py-24 sm:py-32 bg-[#080c16] border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>AUTOMATED DISPUTE DEFENSE PLATFORM</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          Every chargeback has a defense. Automate yours.
        </h2>

        <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed">
          Connect your payment gateway in 2 minutes. Start automatically defending disputes, recovering lost revenue, and protecting your merchant account standing.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span>Open Live Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#roi-calculator"
            className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
          >
            <span>Calculate ROI</span>
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 2-Minute API Connection
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> No Code Required
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Visa CE 3.0 Standard
          </span>
        </div>

      </div>
    </section>
  );
}
