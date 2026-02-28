import React from 'react';
import type { DLQJob } from '../types';
import { ShieldAlert, Download, AlertTriangle } from 'lucide-react';

interface DLQProps {
  dlq: DLQJob[];
}

export const DLQ: React.FC<DLQProps> = ({ dlq }) => {
  const exportCSV = () => {
    if (dlq.length === 0) return;
    const headers = ['ID', 'Queue', 'Failed At', 'Reason'];
    const rows = dlq.map(d => [d.id, d.queue, new Date(d.failed_at).toISOString(), `"${d.reason.replace(/"/g, '""')}"`]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'wida_dlq_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-red-500" /> Dead Letter Queue
          </h2>
          <p className="text-gray-500 text-sm mt-1">Review unrecoverable jobs that exhausted all retry policies. Awaiting manual intervention.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-red-100 rounded-2xl overflow-hidden animate-in fade-in duration-500">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-red-50/50">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-semibold text-red-800 uppercase tracking-wider">Failed Job ID</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-red-800 uppercase tracking-wider">Source Queue</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-red-800 uppercase tracking-wider">Fatal Reason</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-red-800 uppercase tracking-wider">Attempts Consumed</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-red-800 uppercase tracking-wider">Time of Death</th>
                <th className="px-8 py-4 text-right text-xs font-semibold text-red-800 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50 text-sm">
              {dlq.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 text-green-500 mb-4">
                      <ShieldAlert size={32} />
                    </div>
                    <p className="text-gray-900 font-semibold">DLQ is completely empty.</p>
                    <p className="text-gray-500 text-sm mt-1">Excellent! No unrecoverable errors detected recently.</p>
                  </td>
                </tr>
              ) : (
                dlq.map((d) => (
                  <tr key={d.id} className="hover:bg-red-50/20 transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap text-gray-900 font-mono text-sm font-medium">{d.id}</td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">{d.queue}</span>
                    </td>
                    <td className="px-8 py-5 text-red-600 text-xs max-w-xs truncate font-mono bg-red-50/50 rounded-md p-2 m-2 border border-red-100" title={d.reason}>
                      {d.reason}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-gray-500 text-center font-medium">
                      {d.attempts?.length || 0}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-gray-500 text-xs">
                      {new Date(d.failed_at).toLocaleString()}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right">
                      {/* Interactive mock buttons removed by request */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {dlq.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-5 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-900">Alert Hook Triggered</h4>
            <p className="text-sm text-red-700 mt-1 leading-relaxed">System notifications have been dispatched referencing {dlq.length} critical failures in the execution pipeline. Please ensure the relevant operational teams are reviewing the exact failure payloads.</p>
            <button className="mt-3 text-sm text-red-600 font-semibold hover:text-red-800 underline decoration-red-300 underline-offset-4">Resend Webhook Alerts</button>
          </div>
        </div>
      )}
    </div>
  );
};
