'use client';

import React, { useState } from 'react';
import { Shield, UserCheck, Zap, Sliders, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function AiHumanSplit() {
  const [governanceMode, setGovernanceMode] = useState<'hybrid' | 'autopilot'>('hybrid');

  return (
    <section className="py-20 sm:py-28 bg-[#0e1320] border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>RISK GOVERNANCE & CONTROL</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Automation prepares. Your risk team stays in control.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Configure automated submission rules based on dispute value, case strength score, and merchant risk tolerance. Run 100% autonomous submissions or mandate risk manager sign-off for high-value cases.
          </p>
        </div>

        {/* 2 Governance Modes Grid */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Mode 1: Automated Submission */}
          <div className="rounded-xl border border-slate-800 bg-[#090d16] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-950/60 border border-blue-800/80 text-blue-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Autonomous Zero-Touch Mode</h3>
                  <p className="text-xs text-slate-400">Recommended for standard volume disputes</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
                AUTOPILOT
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              When a dispute occurs, evidence is gathered, scored, and submitted directly to your payment gateway without requiring any human touch.
            </p>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Auto-submits whenever Evidence Strength Score is &ge; 80/100.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Submits within 15 minutes to maximize gateway SLA compliance.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Slack & webhook notifications dispatched upon bank decision.</span>
              </div>
            </div>
          </div>

          {/* Mode 2: Hybrid Risk Review */}
          <div className="rounded-xl border border-slate-800 bg-[#090d16] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800/80 text-indigo-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Risk Analyst Review Portal</h3>
                  <p className="text-xs text-slate-400">For high-dollar or custom policy disputes</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                GOVERNED
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              AI gathers the exhibits and drafts the legal rebuttal memorandum. Risk leads review the prepared dossier and approve representment with one click.
            </p>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Triggered for disputes exceeding custom threshold (e.g. &gt; $1,000).</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Inline editing for custom contractual addendums and notes.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Cryptographic audit log records analyst sign-off and timestamp.</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
