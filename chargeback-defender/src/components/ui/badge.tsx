import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'outline'
    | 'purple'
    | 'pending'
    | 'submitted';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-slate-100 text-slate-800 border-slate-200',
      success: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
      warning: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
      danger: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
      info: 'bg-sky-50 text-sky-700 border-sky-200 font-medium',
      outline: 'bg-transparent text-slate-700 border-slate-300 font-medium',
      purple: 'bg-purple-50 text-purple-700 border-purple-200 font-medium',
      pending: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold animate-pulse',
      submitted: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border whitespace-nowrap shrink-0 transition-colors',
          variants[variant] || variants.default,
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
