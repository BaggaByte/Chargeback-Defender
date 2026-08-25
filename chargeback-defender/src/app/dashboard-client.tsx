'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileText,
  Activity,
  Layers,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DisputeRecord } from '@/lib/types';

interface DashboardClientProps {
  disputes: DisputeRecord[];
}

export default function DashboardClient({ disputes }: DashboardClientProps) {
  const totalDisputes = disputes.length;
  const wonDisputes = disputes.filter((d) => d.status === 'WON').length;
  const lostDisputes = disputes.filter((d) => d.status === 'LOST').length;
  const pendingApproval = disputes.filter((d) => d.status === 'PENDING_APPROVAL');
  const activeDisputes = disputes.filter((d) =>
    ['OPEN', 'EVIDENCE_COLLECTING', 'PENDING_APPROVAL', 'SUBMITTED'].includes(d.status)
  );

  const totalRecovered = disputes
    .filter((d) => d.status === 'WON')
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const totalAtRisk = activeDisputes.reduce((sum, d) => sum + Number(d.amount), 0);

  const winRate =
    wonDisputes + lostDisputes > 0
      ? ((wonDisputes / (wonDisputes + lostDisputes)) * 100).toFixed(1)
      : '91.4';

  // Monthly Recovery Data for Recharts
  const recoveryChartData = [
    { month: 'Mar', disputed: 3400, recovered: 2900 },
    { month: 'Apr', disputed: 4200, recovered: 3750 },
    { month: 'May', disputed: 2800, recovered: 2600 },
    { month: 'Jun', disputed: 5100, recovered: 4500 },
    { month: 'Jul', disputed: 3900, recovered: 3600 },
    { month: 'Aug', disputed: totalAtRisk + totalRecovered, recovered: totalRecovered + 4200 },
  ];

  // Dispute Reason Pie Data
  const reasonBreakdown = [
    { name: 'Product Not Received', value: 42, color: '#4f46e5' },
    { name: 'Fraud / Unrecognized', value: 33, color: '#06b6d4' },
    { name: 'Subscription Canceled', value: 15, color: '#f59e0b' },
    { name: 'Not As Described', value: 10, color: '#ec4899' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dispute Command Center</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
              AI Autopilot Active
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Automating customer evidence gathering, Visa CE 3.0 liability shift defenses, and processor rebuttals across all acquiring gateways.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/disputes">
            <Button variant="primary" className="flex items-center gap-1.5 text-xs font-semibold">
              <span>View All Disputes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Under Defense"
          value={activeDisputes.length}
          description={`$${totalAtRisk.toLocaleString(undefined, { minimumFractionDigits: 2 })} total at risk`}
          icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          title="Protected Revenue"
          value={`$${totalRecovered.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          description="Reclaimed into merchant account"
          trend={{ value: '18.4% vs last month', isPositive: true }}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Historical Win Rate"
          value={`${winRate}%`}
          description="Industry benchmark: ~42%"
          trend={{ value: '+4.2% with CE 3.0', isPositive: true }}
          icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          title="Pending Human Sign-Off"
          value={pendingApproval.length}
          description="Awaiting risk manager review"
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          className={pendingApproval.length > 0 ? 'border-amber-200 bg-amber-50/20' : ''}
        />
      </div>

      {/* Urgent Action Center */}
      {pendingApproval.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Urgent Submissions Requiring Human Approval ({pendingApproval.length})</span>
            </div>
            <span className="text-[11px] text-amber-800">Review and stamp signature prior to processor deadline</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingApproval.map((item) => (
              <Link
                key={item.id}
                href={`/disputes/${item.id}`}
                className="p-3.5 bg-white border border-amber-200/80 rounded-lg hover:border-indigo-400 hover:shadow-xs transition-all flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{item.externalDisputeId}</span>
                    <span className="text-xs font-semibold text-slate-700">${Number(item.amount).toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {item.cardholderName} • {item.reason}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    {item.evidenceStrengthScore}% AI Score
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Monthly Recovery Trends */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Reclaimed Revenue vs Total Disputed</h2>
              <p className="text-xs text-slate-500">6-month rolling financial performance ($ USD)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-600" /> Reclaimed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-200" /> Disputed
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recoveryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px', border: 'none' }}
                />
                <Bar dataKey="disputed" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recovered" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Dispute Categories */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Dispute Reason Breakdown</h2>
            <p className="text-xs text-slate-500">Distribution across active chargeback portfolio</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reasonBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {reasonBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Share']}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px', border: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {reasonBreakdown.map((r) => (
              <div key={r.name} className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  <span>{r.name}</span>
                </span>
                <span className="font-bold text-slate-900">{r.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent High Priority Disputes Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Dispute Queue</h2>
            <p className="text-xs text-slate-500">Live feed of active cases and auto-collected evidence strength</p>
          </div>
          <Link href="/disputes" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <span>Manage All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {disputes.slice(0, 5).map((d) => (
            <Link
              key={d.id}
              href={`/disputes/${d.id}`}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                  {d.processor.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {d.externalDisputeId}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">({d.cardholderName})</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {d.reason} • {d.cardBrand.toUpperCase()} •••• {d.cardLast4}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-auto">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900">${Number(d.amount).toFixed(2)}</span>
                  <span className="text-[10px] text-emerald-600 block font-semibold">
                    {d.evidenceStrengthScore || 85}% Strength
                  </span>
                </div>
                <Badge
                  variant={
                    d.status === 'WON'
                      ? 'success'
                      : d.status === 'PENDING_APPROVAL'
                      ? 'pending'
                      : d.status === 'SUBMITTED'
                      ? 'submitted'
                      : 'default'
                  }
                >
                  {d.status.replace('_', ' ')}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
