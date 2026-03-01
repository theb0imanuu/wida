import React, { useState } from 'react';
import type { Job } from '../types';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { PlayCircle, Clock, CheckCircle2, XCircle, ChevronRight, X } from 'lucide-react';

interface JobsProps {
  jobs: Job[];
}

type BadgeVariant = 'pending' | 'running' | 'success' | 'failed' | 'dead';

export const Jobs: React.FC<JobsProps> = ({ jobs }) => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-black/20">
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Job Execution History</h3>
        </div>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Job ID</TableHead>
              <TableHead>Queue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </tr>
          </TableHeader>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-secondary">
                  No jobs found in the queue.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id} onClick={() => setSelectedJob(job)} className="cursor-pointer group border-l-2 border-transparent hover:border-blue-500">
                  <TableCell className="font-mono text-sm font-medium text-primary">{job.id}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-primary border border-border">{job.queue}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={job.status as BadgeVariant}>{job.status}</Badge>
                  </TableCell>
                  <TableCell className="text-secondary text-sm">
                    {job.attempts ? job.attempts.length : 0} <span className="opacity-40">/ {job.max_retries}</span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <ChevronRight className="inline-block w-4 h-4 text-secondary group-hover:text-primary transition-colors" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      {/* Slide-over Modal */}
      {selectedJob && (
        <React.Fragment>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedJob(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col">
            <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-black/20">
              <div>
                <h2 className="text-lg font-semibold text-primary flex items-center gap-3">
                  Job Inspector <Badge variant={selectedJob.status as BadgeVariant}>{selectedJob.status}</Badge>
                </h2>
                <p className="text-xs text-secondary mt-1 font-mono">{selectedJob.id}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-2 text-secondary hover:text-primary rounded hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6 p-5 bg-card rounded-lg border border-border">
                <div>
                  <span className="block text-[10px] text-secondary uppercase tracking-widest mb-1.5 font-semibold">Queue Name</span>
                  <span className="font-medium text-primary text-sm">{selectedJob.queue}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-secondary uppercase tracking-widest mb-1.5 font-semibold">Max Retries</span>
                  <span className="font-medium text-primary text-sm">{selectedJob.max_retries}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-secondary uppercase tracking-widest mb-1.5 font-semibold">CRON Schedule</span>
                  <span className="font-medium text-primary text-sm">{selectedJob.cron_expr || 'Not Scheduled'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-secondary uppercase tracking-widest mb-1.5 font-semibold">Timeout</span>
                  <span className="font-medium text-primary text-sm">{selectedJob.timeout} ns</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Payload Data</h4>
                </div>
                <div className="bg-[#0B0F14] rounded-lg p-5 overflow-x-auto border border-border">
                  <pre className="text-[#E6EDF3] font-mono text-xs leading-relaxed">
                    {JSON.stringify(selectedJob.payload, null, 2)}
                  </pre>
                </div>
              </div>

              {selectedJob.attempts && selectedJob.attempts.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-semibold text-secondary uppercase tracking-widest mb-3">Execution History</h4>
                  <div className="space-y-3">
                    {selectedJob.attempts.map((attempt, idx) => (
                      <div key={idx} className="bg-card rounded-lg p-4 border border-border flex flex-col relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${attempt.status === 'success' ? 'bg-status-success' : 'bg-status-failed'}`}></div>
                        <div className="flex justify-between items-start mb-3 pl-2">
                          <span className="font-medium text-primary text-sm flex items-center gap-2">
                            {attempt.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-status-success" /> : <XCircle className="w-4 h-4 text-status-failed" />}
                            Attempt #{idx + 1}
                          </span>
                          <Badge variant={attempt.status as BadgeVariant}>{attempt.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-secondary mb-2 pl-2">
                          <div className="flex items-center gap-2">
                            <PlayCircle className="w-3.5 h-3.5 opacity-50" /> Started: {new Date(attempt.started_at).toLocaleTimeString()}
                          </div>
                          {attempt.finished_at && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 opacity-50" /> Finished: {new Date(attempt.finished_at).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                        {attempt.error && (
                          <div className="mt-3 ml-2 text-status-dead bg-status-dead/10 p-3 rounded border border-status-dead/20 font-mono text-[11px] break-all">
                            {attempt.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-border bg-black/20 flex justify-end gap-3">
               {['failed'].includes(selectedJob.status) && (
                 <Button variant="primary">
                   Retry Job Manually
                 </Button>
               )}
               <Button variant="danger">
                 Move to DLQ
               </Button>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};
