'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calculator, DollarSign, Clock, ArrowRight } from 'lucide-react';

export function RoiCalculator() {
  const [monthlyDisputes, setMonthlyDisputes] = useState<number>(100);
  const [avgDisputeValue, setAvgDisputeValue] = useState<number>(250);
  const [currentWinRate, setCurrentWinRate] = useState<number>(30);

  const totalVolumeAtRisk = monthlyDisputes * avgDisputeValue;
  const defenderWinRate = 87.4;
  const currentMonthlyRecovery = totalVolumeAtRisk * (currentWinRate / 100);
  const defenderMonthlyRecovery = totalVolumeAtRisk * (defenderWinRate / 100);
  const netMonthlyGain = Math.max(0, defenderMonthlyRecovery - currentMonthlyRecovery);
  const netAnnualGain = netMonthlyGain * 12;
  const hoursSavedWeekly = Math.round((monthlyDisputes * 1.25) / 4);

  return (
    <section id="roi-calculator" className="py-20 sm:py-28 bg-[#0e1320] border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            <Calculator className="w-3.5 h-3.5 text-blue-400" />
            <span>FINANCIAL REVENUE MODEL</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Calculate your recovered revenue.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Estimate how much lost dispute revenue Chargeback Defender reclaims directly back to your merchant settlement account each month.
          </p>
        </div>

        {/* Calculator Card */}
        <div className="mt-12 rounded-xl border border-slate-800 bg-[#090d16] p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Inputs (Left 7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Slider 1 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-300">Monthly Dispute Volume</span>
                  <span className="text-white font-mono font-bold text-sm">{monthlyDisputes} cases / mo</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={monthlyDisputes}
                  onChange={(e) => setMonthlyDisputes(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>10 cases</span>
                  <span>500 cases</span>
                  <span>1,000 cases</span>
                </div>
              </div>

              {/* Slider 2 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-300">Average Dispute Amount</span>
                  <span className="text-white font-mono font-bold text-sm">${avgDisputeValue} USD</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="2000"
                  step="25"
                  value={avgDisputeValue}
                  onChange={(e) => setAvgDisputeValue(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>$25</span>
                  <span>$1,000</span>
                  <span>$2,000</span>
                </div>
              </div>

              {/* Slider 3 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-300">Current Manual Win Rate</span>
                  <span className="text-white font-mono font-bold text-sm">{currentWinRate}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="70"
                  step="1"
                  value={currentWinRate}
                  onChange={(e) => setCurrentWinRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>10% (Low)</span>
                  <span>30% (Industry Average)</span>
                  <span>70% (High)</span>
                </div>
              </div>

              {/* Labor Hours Saved */}
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-300">Estimated Analyst Time Saved</span>
                </div>
                <span className="font-mono text-white font-bold">~{hoursSavedWeekly} hours / week</span>
              </div>
            </div>

            {/* Results Column (Right 5 Cols) */}
            <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0e1320] p-6 sm:p-7 space-y-6">
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  MONTHLY VOLUME AT RISK
                </span>
                <span className="text-2xl font-bold font-mono text-white mt-0.5 block">
                  ${totalVolumeAtRisk.toLocaleString()}
                  <span className="text-xs text-slate-400 font-normal"> / mo</span>
                </span>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  PROJECTED RECOVERY (87.4% WIN RATE)
                </span>
                <span className="text-2xl font-bold font-mono text-white block">
                  ${Math.round(defenderMonthlyRecovery).toLocaleString()}
                  <span className="text-xs text-slate-400 font-normal"> / mo</span>
                </span>
              </div>

              <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/80 space-y-1">
                <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                  NET ADDITIONAL REVENUE GAINED
                </span>
                <span className="text-3xl font-extrabold font-mono text-emerald-400 block">
                  +${Math.round(netMonthlyGain).toLocaleString()}
                  <span className="text-xs text-emerald-300 font-normal"> / mo</span>
                </span>
                <span className="text-xs font-mono text-emerald-300 block pt-1">
                  +${Math.round(netAnnualGain).toLocaleString()} annual lift
                </span>
              </div>

              <Link
                href="/"
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Start Recovering Revenue</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
