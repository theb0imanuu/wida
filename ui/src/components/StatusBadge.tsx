import React from 'react';

export const StatusBadge = ({ status }: { status: string }) => {
  const getColors = () => {
    switch(status.toLowerCase()) {
      case 'running': return 'bg-green-50 text-green-700 border-green-100';
      case 'failed': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'dead': return 'bg-red-50 text-red-700 border-red-100';
      case 'success': return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'pending': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getColors()} capitalize items-center`}>
      {status === 'running' && (
        <span className="flex h-2 w-2 relative mr-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      )}
      {status}
    </span>
  );
};
