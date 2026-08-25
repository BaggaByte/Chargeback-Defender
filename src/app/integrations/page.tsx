import { db } from '@/db';
import { integrations } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle, Plus, Settings } from 'lucide-react';

export default async function IntegrationsPage() {
  const allIntegrations = await db.select().from(integrations);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
        <p className="text-slate-500">Connect your payment processors to automate evidence collection.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Integrations */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Connected Processors</h2>
          <div className="grid grid-cols-1 gap-4">
            {allIntegrations.map((integration) => (
              <div key={integration.id} className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 capitalize">{integration.processor}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="success" className="text-[10px] h-4">Connected</Badge>
                      <span className="text-xs text-slate-500">Syncing every 15 mins</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Settings className="w-3 h-3" />
                  Configure
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Add New */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Add Integration</h2>
          <div className="bg-white border-2 border-dashed border-slate-200 p-8 rounded-xl text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Add New Processor</p>
              <p className="text-xs text-slate-500 mt-1">Connect Stripe, PayPal, Adyen or others.</p>
            </div>
            <Button className="w-full">Connect Now</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
