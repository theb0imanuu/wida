import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white bg-blue-600 hover:bg-blue-700 border-transparent',
  secondary: 'bg-transparent text-primary border border-border hover:bg-white/5',
  ghost: 'bg-transparent text-secondary hover:text-primary hover:bg-white/5 border-transparent',
  danger: 'bg-transparent text-dead border border-status-dead/30 hover:bg-status-dead/10',
};

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--background)] focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
