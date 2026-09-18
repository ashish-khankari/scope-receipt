import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]',
    warning: 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]',
    outline: 'bg-transparent text-gray-700 border-gray-300',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium tracking-wide uppercase',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
