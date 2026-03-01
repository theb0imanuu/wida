import React from 'react';

type BadgeVariant = 'pending' | 'running' | 'success' | 'failed' | 'dead';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  pending: 'bg-status-pending/10 text-pending border border-status-pending/20',
  running: 'bg-status-running/10 text-running border border-status-running/20',
  success: 'bg-status-success/10 text-success border border-status-success/20',
  failed: 'bg-status-failed/10 text-failed border border-status-failed/20',
  dead: 'bg-status-dead/10 text-dead border border-status-dead/20',
};

export function Badge({ variant, children, className = '', ...props }: BadgeProps) {
  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
