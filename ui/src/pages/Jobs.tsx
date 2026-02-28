import React, { useState } from 'react';
import type { Job } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PlayCircle, Clock, CheckCircle2, XCircle, ChevronRight, X } from 'lucide-react';

interface JobsProps {
  jobs: Job[];
}

export const Jobs: React.FC<JobsProps> = ({ jobs }) => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  return (
    <div className="relative">
      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden animate-in fade-in duration-500">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-semibold text-gray-900">Job Execution History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-white">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job ID</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Queue</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Attempts</th>
                <th className="px-8 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50 text-sm">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-10 text-center text-gray-400">No jobs found in the queue.</td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} onClick={() => setSelectedJob(job)} className="hover:bg-brand-50/30 transition-colors group cursor-pointer border-l-4 border-transparent hover:border-brand-500">
                    <td className="px-8 py-5 whitespace-nowrap text-gray-900 font-mono text-sm font-medium">{job.id}</td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">{job.queue}</span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-gray-500">
                      {job.attempts ? job.attempts.length : 0} <span className="opacity-50">/ {job.max_retries}</span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right font-medium">
                      <ChevronRight className="inline-block w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Modal */}
      {selectedJob && (
        <React.Fragment>
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedJob(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 flex flex-col">
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-gray-50/80">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  Job Inspector <StatusBadge status={selectedJob.status} />
                </h2>
                <p className="text-xs text-gray-500 mt-1 font-mono">{selectedJob.id}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors bg-white shadow-sm border border-gray-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
              <div className="grid grid-cols-2 gap-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Queue Name</span>
                  <span className="font-semibold text-gray-900">{selectedJob.queue}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Max Retries</span>
                  <span className="font-semibold text-gray-900">{selectedJob.max_retries}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">CRON Schedule</span>
                  <span className="font-semibold text-gray-900">{selectedJob.cron_expr || 'Not Scheduled'}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Timeout</span>
                  <span className="font-semibold text-gray-900">{selectedJob.timeout} ns</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Payload Data</h4>
                  <button className="text-brand-600 hover:text-brand-800 text-xs font-semibold">Copy JSON</button>
                </div>
                <div className="bg-[#1e1e1e] rounded-xl p-5 overflow-x-auto shadow-inner border border-gray-800">
                  <pre className="text-[#ce9178] font-mono text-sm leading-relaxed">
                    {JSON.stringify(selectedJob.payload, null, 2)}
                  </pre>
                </div>
              </div>

              {selectedJob.attempts && selectedJob.attempts.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Execution History</h4>
                  <div className="space-y-4">
                    {selectedJob.attempts.map((attempt, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${attempt.status === 'success' ? 'bg-teal-500' : 'bg-red-500'}`}></div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-bold text-gray-800 flex items-center gap-2">
                            {attempt.status === 'success' ? <CheckCircle2 className="w-5 h-5 text-teal-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                            Attempt #{idx + 1}
                          </span>
                          <StatusBadge status={attempt.status} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <PlayCircle className="w-4 h-4 opacity-50" /> Started: {new Date(attempt.started_at).toLocaleString()}
                          </div>
                          {attempt.finished_at && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 opacity-50" /> Finished: {new Date(attempt.finished_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                        {attempt.error && (
                          <div className="mt-2 text-red-700 bg-red-50 p-3 rounded-lg border border-red-100 font-mono text-xs break-all">
                            {attempt.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50/80 flex justify-end gap-4">
               {['failed'].includes(selectedJob.status) && (
                 <button className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all focus:ring-4 focus:ring-brand-100 flex items-center gap-2">
                   Retry Job Manually
                 </button>
               )}
               <button className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-lg transition-all focus:ring-4 focus:ring-red-50 flex items-center gap-2 border border-red-100">
                 Move to DLQ
               </button>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};
