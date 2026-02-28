import React from 'react';
import type { GlobalStats, Job, WorkerStats, DLQJob } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface DashboardProps {
  stats: GlobalStats;
  jobs: Job[];
  workers: WorkerStats[];
  dlq: DLQJob[];
  isLeader: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, jobs, workers, dlq, isLeader }) => {

  // Historical timeseries data not currently implemented in backend
  const lineData: Record<string, unknown>[] = [];

  // Pie Chart Data (Status distribution)
  const pieData = [
    { name: 'Pending', value: jobs.filter(j => j.status === 'pending').length, color: '#3B82F6' },
    { name: 'Running', value: jobs.filter(j => j.status === 'running').length, color: '#10B981' },
    { name: 'Success', value: jobs.filter(j => j.status === 'success').length, color: '#14B8A6' },
    { name: 'Failed', value: jobs.filter(j => j.status === 'failed').length, color: '#F97316' },
    { name: 'Dead', value: dlq.length, color: '#EF4444' }
  ].filter(d => d.value > 0);

  // Bar Chart Data (Queue backlog)
  const queueMap = new Map<string, number>();
  jobs.filter(j => j.status === 'pending').forEach(j => {
    queueMap.set(j.queue, (queueMap.get(j.queue) || 0) + 1);
  });
  const barData = Array.from(queueMap.entries()).map(([name, pending]) => ({ name, pending }));

  const kpis = [
    { name: 'Total Jobs', value: stats.totalJobs.toString(), change: 'Live', status: 'neutral' },
    { name: 'Active Workers', value: workers.length.toString(), change: 'Live', status: 'running' },
    { name: 'Scheduler Status', value: isLeader ? 'Leader' : 'Standby', change: 'Live', status: isLeader ? 'running' : 'neutral' },
    { name: 'Dead Letter Queue', value: stats.deadJobs.toString(), change: 'Live', status: 'dead' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
            <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">{stat.name}</p>
            <div className="mt-4 flex items-baseline justify-between">
              <p className="text-4xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{stat.value}</p>
              <span className={`text-sm font-medium px-2 py-1 rounded-md ${
                stat.status === 'dead' ? 'bg-red-50 text-red-600' : 
                stat.status === 'running' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Jobs Processed (Last 6h)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="success" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Status Distribution</h3>
          <div className="h-72 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400">No data available</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center text-xs text-gray-600">
                <span className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: d.color }}></span>
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Queue Backlog (Pending)</h3>
          <div className="h-64 w-full">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="pending" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">No pending jobs in any queue</div>
            )}
          </div>
        </div>

        {/* Recent Activity Mini-Table */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Recent Activity</h3>
          <div className="flex-1 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-white sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Job ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Queue</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50 text-sm">
                {jobs.slice(0, 5).map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-mono text-xs">{job.id.substring(0, 15)}...</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">{job.queue}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`w-2 h-2 rounded-full inline-block mr-2 ${
                        job.status === 'success' ? 'bg-teal-500' :
                        job.status === 'running' ? 'bg-green-500' :
                        job.status === 'failed' ? 'bg-orange-500' : 'bg-blue-500'
                      }`}></span>
                      <span className="capitalize">{job.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
