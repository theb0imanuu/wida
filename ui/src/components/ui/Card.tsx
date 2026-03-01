import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div 
      className={`bg-card border border-border rounded-xl p-4 sm:p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
