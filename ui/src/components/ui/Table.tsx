import React from 'react';

export function Table({ children, className = '', ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-hidden border border-border rounded-xl">
      <div className="overflow-x-auto">
        <table className={`w-full text-sm text-left ${className}`} {...props}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function TableHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`text-xs text-secondary uppercase bg-black/20 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableRow({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`border-b border-border hover:bg-white/5 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-4 py-3 font-medium whitespace-nowrap ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3 ${className}`} {...props}>
      {children}
    </td>
  );
}
