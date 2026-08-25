'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockCustomers } from '@/db/seed-data';
import { CustomerProfileData } from '@/lib/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerProfileData[]>(mockCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfileData | null>(null);

  const filtered = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Evidence 360</h1>
          <p className="text-xs text-slate-500 mt-1">
            Unified cardholder identities linking session IPs, device telemetry, terms acceptance, and past dispute win records.
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, email, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((cust) => (
          <div
            key={cust.id}
            className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
            onClick={() => setSelectedCustomer(cust)}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {cust.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{cust.name}</h3>
                    <p className="text-xs text-slate-500">{cust.email}</p>
                  </div>
                </div>
                <Badge variant={cust.fraudRiskScore < 20 ? 'success' : 'warning'}>
                  {cust.fraudRiskScore}/100 Risk
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">LTV</span>
                  <span className="font-bold text-slate-900">${cust.lifetimeValue.toFixed(2)}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Orders</span>
                  <span className="font-bold text-slate-900">{cust.totalOrdersCount} Orders</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Dispute History</span>
                  <span className="font-semibold text-emerald-600">
                    {cust.previousDisputesWon} Won / {cust.previousDisputesCount} Total
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Terms Signed</span>
                  <span className="font-semibold text-indigo-700">
                    {cust.hasAcceptedTos ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>

              {cust.address && (
                <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{cust.address}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">
                {cust.sessionLogs?.length || 0} telemetry logs
              </span>
              <button className="text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1">
                <span>View 360 Profile</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Customer Detailed Drawer/Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base">
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-500">{selectedCustomer.email} • {selectedCustomer.phoneNumber || 'N/A'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Lifetime Value</span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block">
                  ${selectedCustomer.lifetimeValue.toFixed(2)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Dispute Win Ratio</span>
                <span className="text-base font-bold text-emerald-600 mt-0.5 block">
                  {selectedCustomer.previousDisputesCount === 0
                    ? '100% (No Disputes)'
                    : `${((selectedCustomer.previousDisputesWon / selectedCustomer.previousDisputesCount) * 100).toFixed(0)}%`}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Terms of Service</span>
                <span className="text-xs font-bold text-indigo-700 mt-1 block">
                  {selectedCustomer.tosVersion || 'v2025.1 Signed'}
                </span>
              </div>
            </div>

            {/* Session Telemetry Stream */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-indigo-600" />
                <span>Historical Session Telemetry & IP Footprints</span>
              </h4>
              <div className="space-y-2">
                {(selectedCustomer.sessionLogs || []).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{log.action}</span>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        IP: {log.ipAddress} • {log.location}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Link href="/disputes">
                <Button size="sm" variant="primary" className="text-xs">
                  View Associated Disputes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
