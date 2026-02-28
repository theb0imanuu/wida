import React from 'react';
import type { Job } from '../types';
import { Clock, Network, CheckCircle, RefreshCw } from 'lucide-react';

interface SchedulerProps {
  jobs: Job[];
  isLeader: boolean;
}

export const Scheduler: React.FC<SchedulerProps> = ({ jobs, isLeader }) => {
  const cronJobs = jobs.filter(j => j.cron_expr);
  const dagJobs = jobs.filter(j => j.dependencies && j.dependencies.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Clock className="text-brand-500" /> Scheduler Pipeline
          </h2>
          <p className="text-gray-500 text-sm mt-1">Manage recurring CRON jobs and complex Directed Acyclic Graphs.</p>
        </div>
        <div className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2">
          {isLeader ? <CheckCircle size={16} className="text-green-400" /> : <RefreshCw size={16} className="text-yellow-400 animate-spin" />}
          Leader Election: {isLeader ? 'Master' : 'Follower'} Node
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
        
        {/* CRON Section */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <RefreshCw className="text-blue-500" size={20} /> Recurring CRON Jobs
            </h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">{cronJobs.length} Active</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Target ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expression</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50 text-sm">
                {cronJobs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-gray-400 bg-gray-50/30">No CRON jobs scheduled.</td>
                  </tr>
                ) : (
                  cronJobs.map(job => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-gray-900 text-xs font-semibold">{job.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-mono text-gray-700 tracking-widest">{job.cron_expr}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-blue-600 text-xs font-semibold flex items-center gap-1"><CheckCircle size={14} /> Registered</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DAG Section */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Network className="text-purple-500" size={20} /> Directed Acyclic Graphs
            </h3>
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full">{dagJobs.length} Bound</span>
          </div>
          <div className="p-8 flex-1 flex flex-col items-center justify-center bg-gray-50/30">
            {dagJobs.length > 0 ? (
              <div className="w-full">
                <p className="text-sm font-semibold text-gray-700 mb-4 text-center">Observed Dependencies in Pipeline</p>
                <div className="space-y-3">
                  {dagJobs.map(job => (
                    <div key={job.id} className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">{job.id}</span>
                      <div className="h-px bg-purple-200 flex-1 mx-4 relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 border-t-2 border-r-2 border-purple-400 rotate-45 transform"></div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        {job.dependencies!.map(dep => (
                          <span key={dep} className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">Waits for: {dep}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4 border border-dashed border-gray-300">
                  <Network size={24} />
                </div>
                <h4 className="text-sm font-semibold text-gray-900">No Complex DAGs</h4>
                <p className="text-gray-500 text-xs mt-1 max-w-[200px] mx-auto text-center">Jobs with dependency arrays will map visually here.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
