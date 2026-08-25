import { db } from '@/db';
import { disputes } from '@/db/schema';
import { StatCard } from '@/components/ui/stat-card';
import { 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Clock 
} from 'lucide-react';
import { sql } from 'drizzle-orm';

export default async function DashboardPage() {
  const allDisputes = await db.select().from(disputes);
  
  const totalDisputes = allDisputes.length;
  const wonDisputes = allDisputes.filter(d => d.status === 'WON').length;
  const lostDisputes = allDisputes.filter(d => d.status === 'LOST').length;
  const openDisputes = allDisputes.filter(d => ['OPEN', 'EVIDENCE_COLLECTING', 'PENDING_APPROVAL'].includes(d.status)).length;
  
  const recoveredAmount = allDisputes
    .filter(d => d.status === 'WON')
    .reduce((sum, d) => sum + Number(d.amount), 0);
    
  const totalAtRisk = allDisputes
    .filter(d => ['OPEN', 'EVIDENCE_COLLECTING', 'PENDING_APPROVAL'].includes(d.status))
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const recoveryRate = totalDisputes > 0 
    ? ((wonDisputes / (wonDisputes + lostDisputes)) * 100 || 0).toFixed(1) 
    : '0.0';

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Disputes" 
          value={openDisputes} 
          description="Requiring attention"
          icon={<ShieldAlert className="w-5 h-5" />}
          trend={{ value: '12%', isPositive: false }}
        />
        <StatCard 
          title="Recovered Revenue" 
          value={`$${recoveredAmount.toLocaleString()}`} 
          description="Total funds reclaimed"
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ value: '8.4%', isPositive: true }}
        />
        <StatCard 
          title="Recovery Rate" 
          value={`${recoveryRate}%`} 
          description="Win rate vs loss rate"
          icon={<CheckCircle className="w-5 h-5" />}
          trend={{ value: '2.1%', isPositive: true }}
        />
        <StatCard 
          title="Revenue At Risk" 
          value={`$${totalAtRisk.toLocaleString()}`} 
          description="Unresolved disputes"
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Recent Disputes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allDisputes.slice(0, 5).map((dispute) => (
                  <tr key={dispute.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{dispute.externalDisputeId}</td>
                    <td className="px-6 py-4 text-slate-600">${Number(dispute.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-600">{dispute.reason}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dispute.status === 'WON' ? 'bg-green-100 text-green-700' :
                        dispute.status === 'LOST' ? 'bg-red-100 text-red-700' :
                        dispute.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {dispute.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(dispute.deadline).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Win/Loss Distribution</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Won</span>
                <span className="font-medium text-slate-900">{wonDisputes}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-500" 
                  style={{ width: `${(wonDisputes / totalDisputes) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Lost</span>
                <span className="font-medium text-slate-900">{lostDisputes}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-red-500 h-full transition-all duration-500" 
                  style={{ width: `${(lostDisputes / totalDisputes) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Pending</span>
                <span className="font-medium text-slate-900">{openDisputes}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-yellow-500 h-full transition-all duration-500" 
                  style={{ width: `${(openDisputes / totalDisputes) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="text-sm text-indigo-800 leading-relaxed">
              <strong>Strategy Insight:</strong> Your win rate for "Product not received" disputes is 85% when shipping proof is attached.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
