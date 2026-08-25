import { db } from '@/db';
import { disputes } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Search, Filter, Plus, ArrowRight } from 'lucide-react';

export default async function DisputesPage() {
  const allDisputes = await db.select().from(disputes);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Disputes</h1>
          <p className="text-slate-500">Manage and respond to payment disputes across all processors.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Manual Dispute
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by dispute ID, order ID or customer..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">Dispute ID</th>
              <th className="px-6 py-4">Order</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Deadline</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {allDisputes.map((dispute) => (
              <tr key={dispute.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{dispute.externalDisputeId}</td>
                <td className="px-6 py-4 text-slate-600">
                  <Link href={`/disputes/${dispute.id}`} className="text-indigo-600 hover:underline">
                    View Order
                  </Link>
                </td>
                <td className="px-6 py-4 text-slate-600">${Number(dispute.amount).toFixed(2)}</td>
                <td className="px-6 py-4 text-slate-600">{dispute.reason}</td>
                <td className="px-6 py-4">
                  <Badge variant={
                    dispute.status === 'WON' ? 'success' :
                    dispute.status === 'LOST' ? 'danger' :
                    dispute.status === 'PENDING_APPROVAL' ? 'warning' :
                    'default'
                  }>
                    {dispute.status.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {new Date(dispute.deadline).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/disputes/${dispute.id}`}>
                    <Button variant="ghost" size="sm" className="inline-flex items-center gap-1">
                      Manage <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
