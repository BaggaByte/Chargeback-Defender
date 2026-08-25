'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Download,
  Calendar,
  Layers,
  AlertTriangle,
  CreditCard,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DisputeRecord, DisputeStatusType, ProcessorType } from '@/lib/types';

interface DisputesClientProps {
  initialDisputes: DisputeRecord[];
}

export default function DisputesClient({ initialDisputes }: DisputesClientProps) {
  const router = useRouter();
  const [disputes, setDisputes] = useState<DisputeRecord[]>(initialDisputes);
  const [now] = useState(() => Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedProcessor, setSelectedProcessor] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Dispute Form State
  const [newCustomerName, setNewCustomerName] = useState('Jonathan Reynolds');
  const [newCustomerEmail, setNewCustomerEmail] = useState('jonathan.r@enterprise.org');
  const [newAmount, setNewAmount] = useState('480.00');
  const [newReason, setNewReason] = useState('Product not received');
  const [newProcessor, setNewProcessor] = useState<ProcessorType>('stripe');
  const [newCardBrand, setNewCardBrand] = useState('visa');
  const [newCardLast4, setNewCardLast4] = useState('5109');
  const [isCreating, setIsCreating] = useState(false);

  // Filter calculations
  const filteredDisputes = disputes.filter((d) => {
    if (selectedStatus !== 'ALL' && d.status !== selectedStatus) return false;
    if (selectedProcessor !== 'ALL' && d.processor !== selectedProcessor) return false;
    if (selectedRisk !== 'ALL' && d.riskLevel !== selectedRisk) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        d.externalDisputeId.toLowerCase().includes(q) ||
        d.cardholderName.toLowerCase().includes(q) ||
        d.reason.toLowerCase().includes(q) ||
        (d.customer?.email && d.customer.email.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newCustomerName,
          customerEmail: newCustomerEmail,
          amount: parseFloat(newAmount),
          reason: newReason,
          processor: newProcessor,
          cardBrand: newCardBrand,
          cardLast4: newCardLast4,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDisputes((prev) => [data.data, ...prev]);
        setShowCreateModal(false);
        router.refresh();
      }
    } catch {
    } finally {
      setIsCreating(false);
    }
  };

  const loadScenarioPreset = (scenario: 'PHYSICAL' | 'SAAS' | 'HIGH_VALUE') => {
    if (scenario === 'PHYSICAL') {
      setNewCustomerName('Elena Bennett');
      setNewCustomerEmail('elena.b@retailbuyer.com');
      setNewAmount('320.00');
      setNewReason('Product not received');
      setNewProcessor('shopify');
      setNewCardBrand('visa');
      setNewCardLast4('1029');
    } else if (scenario === 'SAAS') {
      setNewCustomerName('Daniel Vance');
      setNewCustomerEmail('d.vance@cloudventures.io');
      setNewAmount('899.00');
      setNewReason('Fraudulent / Cardholder Unrecognized');
      setNewProcessor('stripe');
      setNewCardBrand('mastercard');
      setNewCardLast4('8812');
    } else {
      setNewCustomerName('Global Logistics Partners');
      setNewCustomerEmail('billing@globallogistics.de');
      setNewAmount('2450.00');
      setNewReason('Subscription Canceled Prior to Charge');
      setNewProcessor('paypal');
      setNewCardBrand('amex');
      setNewCardLast4('0014');
    }
  };

  const getStatusBadge = (status: DisputeStatusType) => {
    switch (status) {
      case 'WON':
        return <Badge variant="success">WON</Badge>;
      case 'LOST':
        return <Badge variant="danger">LOST</Badge>;
      case 'PENDING_APPROVAL':
        return <Badge variant="pending">PENDING APPROVAL</Badge>;
      case 'SUBMITTED':
        return <Badge variant="submitted">SUBMITTED</Badge>;
      case 'EVIDENCE_COLLECTING':
        return <Badge variant="warning">COLLECTING</Badge>;
      default:
        return <Badge variant="default">OPEN</Badge>;
    }
  };

  const counts = {
    all: disputes.length,
    open: disputes.filter((d) => d.status === 'OPEN').length,
    pending: disputes.filter((d) => d.status === 'PENDING_APPROVAL').length,
    submitted: disputes.filter((d) => d.status === 'SUBMITTED').length,
    won: disputes.filter((d) => d.status === 'WON').length,
    lost: disputes.filter((d) => d.status === 'LOST').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Disputes</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage, triage with AI, and sign-off on payment disputes across all merchant processors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>New Dispute Intake</span>
          </Button>
        </div>
      </div>

      {/* Status Tabs Pipeline */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'ALL', label: 'All Disputes', count: counts.all },
          { id: 'PENDING_APPROVAL', label: 'Pending Approval', count: counts.pending, alert: counts.pending > 0 },
          { id: 'OPEN', label: 'Open / In Review', count: counts.open },
          { id: 'SUBMITTED', label: 'Submitted to Gateway', count: counts.submitted },
          { id: 'WON', label: 'Won & Recovered', count: counts.won },
          { id: 'LOST', label: 'Lost', count: counts.lost },
        ].map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-md'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  tab.alert
                    ? 'bg-amber-100 text-amber-800'
                    : isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by dispute ID, customer name, email, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Processor filter */}
          <select
            value={selectedProcessor}
            onChange={(e) => setSelectedProcessor(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Processors</option>
            <option value="stripe">Stripe</option>
            <option value="shopify">Shopify Payments</option>
            <option value="paypal">PayPal</option>
            <option value="adyen">Adyen</option>
            <option value="braintree">Braintree</option>
            <option value="square">Square</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical Urgency</option>
          </select>
        </div>
      </div>

      {/* Disputes Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Dispute Ref</th>
                <th className="px-6 py-3.5">Cardholder / Order</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Reason & Code</th>
                <th className="px-6 py-3.5">AI Strength</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Deadline</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No disputes match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((dispute) => {
                  const deadlineDate = new Date(dispute.deadline);
                  const hoursLeft = Math.max(
                    0,
                    Math.round((deadlineDate.getTime() - now) / (1000 * 3600))
                  );
                  const isUrgent =
                    hoursLeft < 48 &&
                    dispute.status !== 'WON' &&
                    dispute.status !== 'LOST' &&
                    dispute.status !== 'SUBMITTED';

                  return (
                    <tr
                      key={dispute.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/disputes/${dispute.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{dispute.externalDisputeId}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <span className="uppercase font-semibold">{dispute.processor}</span>
                          <span>•</span>
                          <span>{dispute.cardBrand.toUpperCase()} •••• {dispute.cardLast4}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{dispute.cardholderName}</div>
                        <span className="text-[11px] text-slate-500">
                          {dispute.customer?.email || 'ORD-REF-8821'}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-900">
                        ${Number(dispute.amount).toFixed(2)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-slate-800 font-medium line-clamp-1">{dispute.reason}</div>
                        <span className="text-[10px] text-slate-400 font-mono">Code {dispute.reasonCode}</span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${dispute.evidenceStrengthScore || 80}%` }}
                            />
                          </div>
                          <span className="font-bold text-indigo-700">
                            {dispute.evidenceStrengthScore || 80}%
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {getStatusBadge(dispute.status)}
                      </td>

                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-1 font-medium ${isUrgent ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'animate-pulse' : ''}`} />
                          <span>{hoursLeft > 0 ? `${hoursLeft}h left` : 'Passed'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {deadlineDate.toLocaleDateString()}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/disputes/${dispute.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:text-indigo-800"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Dispute Intake Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">New Dispute Intake</h3>
                <p className="text-xs text-slate-500">Ingest a chargeback manually or test an industry preset.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>

            {/* Scenario Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Quick Scenario Presets</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => loadScenarioPreset('PHYSICAL')}
                  className="p-2 text-[11px] font-medium border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 text-left"
                >
                  <span className="font-bold text-slate-900 block">Physical Goods</span>
                  <span className="text-[10px] text-slate-500">Delivery signature test</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadScenarioPreset('SAAS')}
                  className="p-2 text-[11px] font-medium border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 text-left"
                >
                  <span className="font-bold text-slate-900 block">SaaS License</span>
                  <span className="text-[10px] text-slate-500">Login telemetry test</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadScenarioPreset('HIGH_VALUE')}
                  className="p-2 text-[11px] font-medium border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 text-left"
                >
                  <span className="font-bold text-slate-900 block">B2B Contract</span>
                  <span className="text-[10px] text-slate-500">Subscription renewal</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateDispute} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Customer Email</label>
                  <input
                    type="email"
                    required
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Disputed Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Payment Processor</label>
                  <select
                    value={newProcessor}
                    onChange={(e) => setNewProcessor(e.target.value as ProcessorType)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="stripe">Stripe</option>
                    <option value="shopify">Shopify Payments</option>
                    <option value="paypal">PayPal</option>
                    <option value="adyen">Adyen</option>
                    <option value="braintree">Braintree</option>
                    <option value="square">Square</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Dispute Reason</label>
                <select
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value="Product not received">Product not received (10.4)</option>
                  <option value="Fraudulent / Cardholder Unrecognized">Fraudulent / Unrecognized (4837)</option>
                  <option value="Subscription Canceled Prior to Charge">Subscription Canceled Prior to Charge</option>
                  <option value="Product Not As Described">Product Not As Described (4853)</option>
                  <option value="Duplicate Charge">Duplicate Processing</option>
                  <option value="Credit Not Processed">Credit Not Processed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Card Network</label>
                  <select
                    value={newCardBrand}
                    onChange={(e) => setNewCardBrand(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">American Express</option>
                    <option value="discover">Discover</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Card Last 4 Digits</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newCardLast4}
                    onChange={(e) => setNewCardLast4(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isCreating}>
                  {isCreating ? 'Ingesting...' : 'Create & Auto-Triage'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
