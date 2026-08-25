'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

const columns = [
  {
    heading: 'Product',
    links: [
      { label: 'Platform overview', href: '#platform' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Integrations', href: '#integrations' },
      { label: 'ROI model', href: '#roi' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    heading: 'Security',
    links: [
      { label: 'Security & compliance', href: '#security' },
      { label: 'SOC 2 Type II', href: '#security' },
      { label: 'PCI DSS Level 1', href: '#security' },
      { label: 'Data residency', href: '#security' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Dispute deadline guide', href: '#how-it-works' },
      { label: 'Visa CE 3.0 overview', href: '#platform' },
      { label: 'Reason code reference', href: '#platform' },
      { label: 'Console', href: '/login' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#platform' },
      { label: 'Careers', href: 'mailto:careers@chargebackdefender.com' },
      { label: 'Contact sales', href: 'mailto:sales@chargebackdefender.com' },
      { label: 'Support', href: 'mailto:support@chargebackdefender.com' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink-950 text-ink-400">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 border-b border-white/10 py-14 md:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2 space-y-4">
            <Link href="/landing" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-ink-900">
                <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-white">
                Chargeback Defender
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed">
              Payment dispute recovery infrastructure for high-volume merchants, marketplaces, and
              subscription platforms.
            </p>
            <div className="inline-flex items-center gap-2 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-ink-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              All systems operational
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.heading} className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-200">
                {col.heading}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) =>
                  link.href.startsWith('mailto:') || link.href.startsWith('/') ? (
                    <li key={link.label}>
                      {link.href.startsWith('mailto:') ? (
                        <a href={link.href} className="text-sm transition-colors hover:text-white">
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className="text-sm transition-colors hover:text-white">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ) : (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm transition-colors hover:text-white">
                        {link.label}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal row */}
        <div className="flex flex-col items-center justify-between gap-4 py-8 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} Chargeback Defender, Inc. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a href="#security" className="transition-colors hover:text-white">
              Privacy Policy
            </a>
            <a href="#security" className="transition-colors hover:text-white">
              Terms of Service
            </a>
            <a href="#security" className="transition-colors hover:text-white">
              DPA
            </a>
            <span className="text-ink-600">SOC 2 Type II · PCI DSS L1 · GDPR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
