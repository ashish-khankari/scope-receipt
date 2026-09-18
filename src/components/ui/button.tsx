import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all rounded-lg focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
      default: 'bg-[#111827] text-white hover:bg-[#1f2937] active:scale-[0.99] shadow-sm',
      primary: 'bg-[#059669] text-white hover:bg-[#047857] shadow-sm active:scale-[0.99]',
      secondary: 'bg-[#f3f4f6] text-[#1f2937] hover:bg-[#e5e7eb] active:scale-[0.99]',
      outline: 'border border-[#d1d5db] bg-white text-[#374151] hover:bg-[#f9fafb] active:scale-[0.99]',
      ghost: 'bg-transparent text-[#6b7280] hover:text-[#111827] hover:bg-black/5',
      destructive: 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.99]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
