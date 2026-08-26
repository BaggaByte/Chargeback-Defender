'use client';

import React, { useState } from 'react';
import { FadeIn } from './fade-in';

const currency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function RoiCalculator() {
  const [monthlyDisputes, setMonthlyDisputes] = useState(120);
  const [avgDisputeValue, setAvgDisputeValue] = useState(180);
  const [currentWinRate, setCurrentWinRate] = useState(32);

  const liftFactor = 3.2;
  const defenderWinRate = Math.min(currentWinRate * liftFactor, 85);
  const monthlyVolume = monthlyDisputes * avgDisputeValue;
  const currentRecovered = monthlyVolume * (currentWinRate / 100);
  const defenderRecovered = monthlyVolume * (defenderWinRate / 100);
  const netMonthlyGain = Math.max(defenderRecovered - currentRecovered, 0);
  const netAnnualGain = netMonthlyGain * 12;
  const analystHoursSaved = Math.round(monthlyDisputes * 1.1);

  const inputs = [
    {
      label: 'Monthly dispute volume',
      value: monthlyDisputes,
      display: `${monthlyDisputes.toLocaleString()} / mo`,
      min: 10,
      max: 1000,
      step: 10,
      onChange: setMonthlyDisputes,
      scale: ['10', '500', '1,000'],
    },
    {
      label: 'Average dispute value',
      value: avgDisputeValue,
      display: currency(avgDisputeValue),
      min: 25,
      max: 2000,
      step: 25,
      onChange: setAvgDisputeValue,
      scale: ['$25', '$1,000', '$2,000'],
    },
    {
      label: 'Your current win rate',
      value: currentWinRate,
      display: `${currentWinRate}%`,
      min: 5,
      max: 80,
      step: 1,
      onChange: setCurrentWinRate,
      scale: ['5%', '40%', '80%'],
    },
  ];

  return (
    <section id="roi" className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <FadeIn delay={0.1} direction="up" className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            Business case
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Model your recovery upside.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-600 sm:text-lg">
            Adjust the inputs to estimate the annual revenue difference between your current win
            rate and a correlation-grade evidence program. Model assumes a {liftFactor}× win-rate
            lift, capped at 85%, consistent with observed median deployments.
          </p>
        </FadeIn>

        <FadeIn delay={0.3} direction="up">
          <div className="mt-12 overflow-hidden rounded-xl border border-ink-200 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Inputs */}
              <div className="space-y-9 bg-white p-7 sm:p-10">
                {inputs.map((input) => (
                  <div key={input.label}>
                    <div className="flex items-baseline justify-between">
                      <label className="text-sm font-medium text-ink-700">{input.label}</label>
                      <span className="text-sm font-semibold tabular-nums text-ink-900">
                        {input.display}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={input.min}
                      max={input.max}
                      step={input.step}
                      value={input.value}
                      onChange={(e) => input.onChange(Number(e.target.value))}
                      className="cd-range mt-4 w-full"
                      aria-label={input.label}
                    />
                    <div className="mt-2 flex justify-between text-[11px] tabular-nums text-ink-400">
                      {input.scale.map((s) => (
                        <span key={s}>{s}</span>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="rounded-lg border border-ink-200 bg-ink-50 p-4 text-xs leading-relaxed text-ink-500">
                  Estimates are directional and exclude processor fees, network assessments, and
                  program-cost avoidance. A formal model is provided during evaluation.
                </div>
              </div>

              {/* Results */}
              <div className="bg-ink-900 p-7 sm:p-10">
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-ink-400">
                  Estimated annual impact
                </div>
                <div className="mt-3 text-5xl font-semibold tracking-tight text-white tabular-nums">
                  {currency(netAnnualGain)}
                </div>
                <div className="mt-2 text-sm text-ink-400">
                  Additional recovered revenue per year
                </div>

                <dl className="mt-9 space-y-5 border-t border-white/10 pt-7">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm text-ink-300">Projected win rate</dt>
                    <dd className="text-sm font-semibold tabular-nums text-white">
                      {currentWinRate}% → {Math.round(defenderWinRate)}%
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm text-ink-300">Monthly recovery, today</dt>
                    <dd className="text-sm font-semibold tabular-nums text-white">
                      {currency(currentRecovered)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm text-ink-300">Monthly recovery, projected</dt>
                    <dd className="text-sm font-semibold tabular-nums text-white">
                      {currency(defenderRecovered)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm text-ink-300">Analyst hours returned / month</dt>
                    <dd className="text-sm font-semibold tabular-nums text-white">
                      ≈ {analystHoursSaved.toLocaleString()} hrs
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
