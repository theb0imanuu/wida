import React from 'react';
import type { GlobalStats, Job, WorkerStats, DLQJob } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/Table';

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
    { name: 'Pending', value: jobs.filter(j => j.status === 'pending').length, color: 'var(--status-pending)' },
    { name: 'Running', value: jobs.filter(j => j.status === 'running').length, color: 'var(--status-running)' },
    { name: 'Success', value: jobs.filter(j => j.status === 'success').length, color: 'var(--status-success)' },
    { name: 'Failed', value: jobs.filter(j => j.status === 'failed').length, color: 'var(--status-failed)' },
    { name: 'Dead', value: dlq.length, color: 'var(--status-dead)' }
  ].filter(d => d.value > 0);

  // Bar Chart Data (Queue backlog)
  const queueMap = new Map<string, number>();
  jobs.filter(j => j.status === 'pending').forEach(j => {
    queueMap.set(j.queue, (queueMap.get(j.queue) || 0) + 1);
  });
  const barData = Array.from(queueMap.entries()).map(([name, pending]) => ({ name, pending }));

  const kpis: { name: string, value: string, change: string, status: 'pending'|'running'|'success'|'failed'|'dead' }[] = [
    { name: 'Total Jobs', value: stats.totalJobs.toString(), change: 'Live', status: 'pending' },
    { name: 'Active Workers', value: workers.length.toString(), change: 'Live', status: 'running' },
    { name: 'Scheduler Status', value: isLeader ? 'Leader' : 'Standby', change: 'Live', status: isLeader ? 'success' : 'pending' },
    { name: 'Dead Letter Queue', value: stats.deadJobs.toString(), change: 'Live', status: 'dead' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((stat) => (
          <Card key={stat.name} className="flex flex-col">
            <p className="text-xs font-medium tracking-wide text-secondary uppercase mb-2">{stat.name}</p>
            <div className="flex items-baseline justify-between mt-auto">
              <p className="text-3xl font-semibold text-primary">{stat.value}</p>
              <Badge variant={stat.status}>{stat.change}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <Card className="lg:col-span-2 flex flex-col h-80">
          <h3 className="text-sm font-medium text-primary mb-4">Jobs Processed (Last 6h)</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }} itemStyle={{ color: 'var(--text-primary)' }} />
                <Line type="monotone" dataKey="success" stroke="var(--status-success)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="failed" stroke="var(--status-failed)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="flex flex-col h-80">
          <h3 className="text-sm font-medium text-primary mb-4">Status Distribution</h3>
          <div className="flex-1 w-full min-h-0 flex items-center justify-center relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }} itemStyle={{ color: 'var(--text-primary)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-secondary text-sm">No data available</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 py-2 mt-auto">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center text-xs text-secondary">
                <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: d.color }}></span>
                {d.name}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="flex flex-col h-80">
          <h3 className="text-sm font-medium text-primary mb-4">Queue Backlog (Pending)</h3>
          <div className="flex-1 w-full min-h-0">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }} itemStyle={{ color: 'var(--text-primary)' }} />
                  <Bar dataKey="pending" fill="var(--status-pending)" radius={[2, 2, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-secondary text-sm">No pending jobs</div>
            )}
          </div>
        </Card>

        {/* Recent Activity Mini-Table */}
        <Card className="flex flex-col h-80 overflow-hidden">
          <h3 className="text-sm font-medium text-primary mb-4 shrink-0">Recent Activity</h3>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Queue</TableHead>
                  <TableHead>Status</TableHead>
                </tr>
              </TableHeader>
              <tbody>
                {jobs.slice(0, 5).map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs text-secondary">{job.id.substring(0, 15)}...</TableCell>
                    <TableCell className="text-xs text-secondary">{job.queue}</TableCell>
                    <TableCell>
                      <Badge variant={job.status as any}>{job.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};
