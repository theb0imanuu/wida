import React from 'react';
import type { Job } from '../types';
import { Clock, Network, CheckCircle, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/Table';

interface SchedulerProps {
  jobs: Job[];
  isLeader: boolean;
}

export const Scheduler: React.FC<SchedulerProps> = ({ jobs, isLeader }) => {
  const cronJobs = jobs.filter(j => j.cron_expr);
  const dagJobs = jobs.filter(j => j.dependencies && j.dependencies.length > 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-primary flex items-center gap-2 tracking-tight">
            <Clock size={20} className="text-secondary" /> Scheduler Pipeline
          </h2>
          <p className="text-sm text-secondary mt-1">Manage recurring CRON jobs and complex Directed Acyclic Graphs.</p>
        </div>
        <div className="px-3 py-1.5 bg-card border border-border text-primary text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2">
          {isLeader ? <CheckCircle size={14} className="text-status-success" /> : <RefreshCw size={14} className="text-status-pending animate-spin" />}
          Leader Election: {isLeader ? 'Master' : 'Follower'} Node
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CRON Section */}
        <Card className="flex flex-col p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-black/20 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
              <RefreshCw className="text-status-pending" size={16} /> Recurring CRON Jobs
            </h3>
            <span className="bg-status-pending/10 text-status-pending text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{cronJobs.length} Active</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Job Target ID</TableHead>
                  <TableHead>Expression</TableHead>
                  <TableHead>Status</TableHead>
                </tr>
              </TableHeader>
              <tbody>
                {cronJobs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-secondary">
                      No CRON jobs scheduled.
                    </td>
                  </tr>
                ) : (
                  cronJobs.map(job => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs font-medium text-primary">{job.id}</TableCell>
                      <TableCell>
                        <span className="px-1.5 py-0.5 bg-white/5 border border-border rounded text-xs font-mono text-secondary tracking-widest">{job.cron_expr}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-status-success text-xs font-medium flex items-center gap-1"><CheckCircle size={12} /> Registered</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card>

        {/* DAG Section */}
        <Card className="flex flex-col p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-black/20 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
              <Network className="text-purple-500" size={16} /> Directed Acyclic Graphs
            </h3>
            <span className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{dagJobs.length} Bound</span>
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-center">
            {dagJobs.length > 0 ? (
              <div className="w-full">
                <p className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-4 text-center">Observed Dependencies in Pipeline</p>
                <div className="space-y-3">
                  {dagJobs.map(job => (
                    <div key={job.id} className="bg-black/20 p-3 rounded-lg border border-border flex items-center justify-between">
                      <span className="font-mono text-xs font-medium text-primary bg-white/5 border border-border px-2 py-1 rounded">{job.id}</span>
                      <div className="h-px bg-purple-500/30 flex-1 mx-4 relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 border-t border-r border-purple-500/50 rotate-45 transform"></div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        {job.dependencies!.map(dep => (
                          <span key={dep} className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20">Waits for: {dep}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-secondary">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-white/5 border border-border border-dashed mb-3">
                  <Network size={20} />
                </div>
                <h4 className="text-sm font-medium text-primary">No Complex DAGs</h4>
                <p className="text-xs mt-1 max-w-[200px] mx-auto text-center">Jobs with dependency arrays will map visually here.</p>
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};
