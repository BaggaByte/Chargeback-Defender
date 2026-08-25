import * as React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard = ({ title, value, description, trend, icon, className }: StatCardProps) => {
  return (
    <div className={cn('p-6 bg-white border border-slate-200 rounded-xl shadow-sm', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        </div>
        {icon && <div className="p-2 bg-slate-50 rounded-lg text-slate-600">{icon}</div>}
      </div>
      <div className="mt-4 flex items-center gap-2">
        {trend && (
          <span className={cn(
            'text-xs font-medium',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
    </div>
  );
};
