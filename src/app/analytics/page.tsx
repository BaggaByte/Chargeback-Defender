'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Award,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '12m'>('90d');

  // Trend Data
  const monthlyTrends = [
    { month: 'Feb', recovered: 4200, lost: 600, winRate: 87.5 },
    { month: 'Mar', recovered: 5100, lost: 450, winRate: 91.8 },
    { month: 'Apr', recovered: 6800, lost: 720, winRate: 90.4 },
    { month: 'May', recovered: 8400, lost: 580, winRate: 93.5 },
    { month: 'Jun', recovered: 9200, lost: 650, winRate: 93.4 },
    { month: 'Jul', recovered: 11400, lost: 800, winRate: 93.4 },
    { month: 'Aug', recovered: 13900, lost: 900, winRate: 93.9 },
  ];

  // Processor Performance Breakdown
  const processorStats = [
    { name: 'Stripe', winRate: 94.2, volume: '$18,400', disputes: 42 },
    { name: 'Shopify Payments', winRate: 91.8, volume: '$12,100', disputes: 28 },
    { name: 'PayPal', winRate: 88.5, volume: '$6,900', disputes: 19 },
    { name: 'Adyen', winRate: 92.0, volume: '$8,500', disputes: 14 },
    { name: 'Braintree', winRate: 90.1, volume: '$4,200', disputes: 8 },
  ];

  // Dispute Category Win Rates
  const categoryStats = [
    { reason: 'Product Not Received', winRate: 95.2, count: 48, avgRecoveryTime: '4.2 days' },
    { reason: 'Fraud / Unrecognized (Visa CE 3.0)', winRate: 92.8, count: 36, avgRecoveryTime: '5.1 days' },
    { reason: 'Subscription Canceled Prior', winRate: 89.4, count: 22, avgRecoveryTime: '3.8 days' },
    { reason: 'Product Not As Described', winRate: 84.1, count: 15, avgRecoveryTime: '6.4 days' },
    { reason: 'Duplicate Charge', winRate: 98.0, count: 9, avgRecoveryTime: '2.1 days' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recovery Analytics & Intelligence</h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical win-loss metrics, processor compliance, and Visa CE 3.0 ROI benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 text-xs">
            {(['30d', '90d', '12m'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                  timeRange === r
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reclaimed (YTD)"
          value="$59,000"
          description="Net funds deposited back into merchant account"
          trend={{ value: '24.1% YoY increase', isPositive: true }}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Weighted Win Rate"
          value="93.4%"
          description="Across 147 representments"
          trend={{ value: '+14% vs pre-Chargeback Defender', isPositive: true }}
          icon={<Award className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          title="Avg Time to Submit"
          value="3.4 Hours"
          description="Processor SLA: 7-14 Days"
          trend={{ value: '88% faster than manual', isPositive: true }}
          icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          title="Card Brand Chargeback Ratio"
          value="0.32%"
          description="Visa/MC Warning Threshold: 0.90%"
          trend={{ value: 'Safe Zone (< 0.65%)', isPositive: true }}
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Monthly Reclaimed vs Lost */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Monthly Recovered vs Lost Volume ($ USD)</h2>
              <p className="text-xs text-slate-500">Demonstrating compounding ROI and defense efficacy</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-600" /> Won ($)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-400" /> Lost ($)
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px', border: 'none' }}
                />
                <Bar dataKey="recovered" name="Won ($)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lost" name="Lost ($)" fill="#fb7185" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Processor Win Rates */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Processor Win Rates</h2>
            <p className="text-xs text-slate-500">Benchmark across acquiring gateways</p>
          </div>

          <div className="space-y-4 pt-2">
            {processorStats.map((proc) => (
              <div key={proc.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{proc.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{proc.volume}</span>
                    <span className="font-bold text-emerald-600">{proc.winRate}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${proc.winRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 text-xs text-indigo-900 leading-snug">
            <strong>Key Insight:</strong> Stripe and Adyen disputes achieve +6.2% higher win rates due to automated 3DS liability shift token indexing.
          </div>
        </div>

      </div>

      {/* Category Performance Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Win Rate by Dispute Category</h2>
          <p className="text-xs text-slate-500">Evaluating automated defense performance per card scheme reason code</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Dispute Category</th>
                <th className="px-4 py-3">Total Cases</th>
                <th className="px-4 py-3">Win Rate</th>
                <th className="px-4 py-3">Avg Resolution Time</th>
                <th className="px-4 py-3 text-right">Primary Compelling Exhibit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryStats.map((cat) => (
                <tr key={cat.reason} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5 font-bold text-slate-900">{cat.reason}</td>
                  <td className="px-4 py-3.5 text-slate-600">{cat.count}</td>
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-emerald-600">{cat.winRate}%</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{cat.avgRecoveryTime}</td>
                  <td className="px-4 py-3.5 text-right font-medium text-slate-700">
                    {cat.reason.includes('Received')
                      ? 'FedEx Direct Signature & GPS'
                      : cat.reason.includes('Fraud')
                      ? 'Visa CE 3.0 Device Footprint'
                      : 'Signed TOS & Cancellation Timestamp'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
