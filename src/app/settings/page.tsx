import { Button } from '@/components/ui/button';
import { Users, Shield, Bell, Globe } from 'lucide-react';

export default function SettingsPage() {
  const settingsSections = [
    {
      name: 'Organization Profile',
      icon: Globe,
      description: 'Manage your company name, logo and legal information.',
    },
    {
      name: 'Team Management',
      icon: Users,
      description: 'Invite new members and manage role-based access control.',
    },
    {
      name: 'Security & API',
      icon: Shield,
      description: 'Manage API keys, webhooks and security settings.',
    },
    {
      name: 'Notifications',
      icon: Bell,
      description: 'Configure alerts for new disputes and deadline warnings.',
    },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your account and organizational preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section) => (
          <div 
            key={section.name} 
            className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <section.icon className="w-5 h-5" />
              </div>
              <Button variant="ghost" size="sm">Manage</Button>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-900">{section.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{section.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
