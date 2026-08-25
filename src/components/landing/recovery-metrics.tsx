'use client';

import React from 'react';
import { DollarSign, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function RecoveryMetrics() {
  const metrics = [
    {
      label: 'Recovered Revenue',
      value: '$4.2M+',
      subtext: 'Reversed back to merchant accounts',
      icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
    },
    {
      label: 'Average Win Rate',
      value: '87.4%',
      subtext: 'Across Visa, Mastercard & Amex',
      icon: <Award className="w-4 h-4 text-blue-400" />,
    },
    {
      label: 'Disputes Won',
      value: '2,480+',
      subtext: 'Fully resolved in merchant favor',
      icon: <ShieldCheck className="w-4 h-4 text-indigo-400" />,
    },
    {
      label: 'Evidence Packets Generated',
      value: '18,500+',
      subtext: 'Zero manual data entry needed',
      icon: <CheckCircle2 className="w-4 h-4 text-cyan-400" />,
    },
  ];

  return (
    <section className="py-16 bg-[#0b0f19] border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {metrics.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl bg-[#0e1320] border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                  {item.label}
                </span>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  {item.icon}
                </div>
              </div>

              <div className="text-3xl sm:text-4xl font-bold text-white font-mono tracking-tight">
                {item.value}
              </div>

              <p className="text-xs text-slate-400 font-medium">
                {item.subtext}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
