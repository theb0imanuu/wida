import React from 'react';
import type { DLQJob } from '../types';
import { ShieldAlert, Download, AlertTriangle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-primary tracking-tight flex items-center gap-2">
            <ShieldAlert size={20} className="text-status-dead" /> Dead Letter Queue
          </h2>
          <p className="text-secondary text-sm mt-1">Review unrecoverable jobs that exhausted all retry policies.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={exportCSV}>
            <Download size={14} className="mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-status-dead/30">
        <Table>
          <TableHeader className="bg-status-dead/5">
            <tr>
              <TableHead className="text-status-dead font-semibold">Failed Job ID</TableHead>
              <TableHead className="text-status-dead font-semibold">Source Queue</TableHead>
              <TableHead className="text-status-dead font-semibold">Fatal Reason</TableHead>
              <TableHead className="text-status-dead font-semibold">Attempts Content</TableHead>
              <TableHead className="text-status-dead font-semibold">Time of Death</TableHead>
            </tr>
          </TableHeader>
          <tbody>
            {dlq.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-16 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-white/5 text-status-success mb-4">
                    <ShieldAlert size={24} />
                  </div>
                  <p className="text-primary font-medium text-sm">DLQ is completely empty.</p>
                  <p className="text-secondary text-xs mt-1">No unrecoverable errors detected recently.</p>
                </td>
              </tr>
            ) : (
              dlq.map((d) => (
                <TableRow key={d.id} className="hover:bg-status-dead/5 border-status-dead/10">
                  <TableCell className="font-mono text-sm font-medium text-primary">{d.id}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-primary border border-border">{d.queue}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-status-dead text-xs max-w-xs truncate font-mono bg-status-dead/10 rounded p-1.5 border border-status-dead/20" title={d.reason}>
                      {d.reason}
                    </div>
                  </TableCell>
                  <TableCell className="text-secondary text-center text-sm">
                    {d.attempts?.length || 0}
                  </TableCell>
                  <TableCell className="text-secondary text-xs">
                    {new Date(d.failed_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </Card>
      
      {dlq.length > 0 && (
        <div className="bg-status-dead/5 border border-status-dead/20 rounded-xl p-4 flex items-start gap-4 shadow-sm">
          <AlertTriangle className="text-status-dead shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-status-dead uppercase tracking-wide">Alert Hook Triggered</h4>
            <p className="text-xs text-status-dead/80 mt-1 leading-relaxed max-w-2xl">
              System notifications have been dispatched referencing {dlq.length} critical failures in the execution pipeline. Please ensure the relevant operational teams are reviewing the exact failure payloads.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
