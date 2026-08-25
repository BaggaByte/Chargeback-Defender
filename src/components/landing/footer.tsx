'use client';

import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#060911] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800">
          
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-white text-sm">
                Chargeback <span className="text-blue-400">Defender</span>
              </span>
            </Link>

            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
              Autonomous dispute recovery for high-volume commerce and subscription platforms. Turn lost chargeback volume into reclaimed revenue.
            </p>

            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>All Systems Operational (99.99%)</span>
            </div>
          </div>

          {/* Product Col */}
          <div className="space-y-3">
            <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] block">
              Product
            </span>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#platform" className="hover:text-white transition-colors">Platform</a></li>
              <li><a href="#engine" className="hover:text-white transition-colors">Evidence Engine</a></li>
              <li><a href="#workbench" className="hover:text-white transition-colors">Live Workbench</a></li>
              <li><a href="#roi-calculator" className="hover:text-white transition-colors">ROI Calculator</a></li>
            </ul>
          </div>

          {/* Integrations Col */}
          <div className="space-y-3">
            <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] block">
              Connectors
            </span>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#integrations" className="hover:text-white transition-colors">Stripe & Radar</a></li>
              <li><a href="#integrations" className="hover:text-white transition-colors">Shopify Payments</a></li>
              <li><a href="#integrations" className="hover:text-white transition-colors">FedEx & Logistics</a></li>
              <li><a href="#integrations" className="hover:text-white transition-colors">Visa CE 3.0 Rules</a></li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="space-y-3">
            <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] block">
              Security & Plans
            </span>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">Security Architecture</a></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Merchant Sign In</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">App Dashboard</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-xs">
          <div>&copy; {new Date().getFullYear()} Chargeback Defender Inc. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span>PCI-DSS Level 1 Compliant</span>
            <span>•</span>
            <span>Visa CE 3.0 Standard</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
