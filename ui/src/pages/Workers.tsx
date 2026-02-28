import React from 'react';
import type { WorkerStats } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Activity } from 'lucide-react';

interface WorkersProps {
  workers: WorkerStats[];
}

export const Workers: React.FC<WorkersProps> = ({ workers }) => {
  return (
    <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden animate-in fade-in duration-500">
      <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="text-brand-500" /> Active Worker Nodes
          </h3>
          <p className="text-sm text-gray-500 mt-1">Real-time status of all registered worker processes</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-white">
            <tr>
              <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Worker ID</th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Execution</th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jobs Processed</th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Heartbeat</th>
              <th className="px-8 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50 text-sm">
            {workers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-10 text-center text-gray-400">No active workers found in network registry.</td>
              </tr>
            ) : (
              workers.map((w) => {
                const isAlive = (new Date().getTime() - new Date(w.last_heartbeat).getTime()) < 60000;
                const statusState = !isAlive ? 'dead' : w.status === 'running' ? 'running' : 'pending'; // 'pending' maps to our blue default colors for idle
                
                return (
                  <tr key={w.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap text-gray-900 font-mono text-sm font-medium">{w.id}</td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <StatusBadge status={statusState === 'pending' ? 'idle' : statusState === 'dead' ? 'offline' : 'busy'} />
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap font-mono text-xs">
                      {w.current_job_id ? (
                        <span className="bg-brand-50 text-brand-700 px-2.5 py-1 rounded border border-brand-100">{w.current_job_id}</span>
                      ) : (
                        <span className="text-gray-400">---</span>
                      )}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-gray-600 font-medium">
                      {w.jobs_completed.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-gray-500 text-xs flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${isAlive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                       {new Date(w.last_heartbeat).toLocaleString()}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right">
                      {/* Mock interactive worker actions removed */}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
