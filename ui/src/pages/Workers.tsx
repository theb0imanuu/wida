import React from 'react';
import type { WorkerStats } from '../types';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Activity } from 'lucide-react';

interface WorkersProps {
  workers: WorkerStats[];
}

export const Workers: React.FC<WorkersProps> = ({ workers }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-primary flex items-center gap-2 tracking-tight">
            <Activity size={20} className="text-secondary" /> Active Worker Nodes
          </h2>
          <p className="text-sm text-secondary mt-1">Real-time status of all registered worker processes.</p>
        </div>
      </div>
      
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Worker ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Current Execution</TableHead>
              <TableHead>Jobs Processed</TableHead>
              <TableHead>Last Heartbeat</TableHead>
            </tr>
          </TableHeader>
          <tbody>
            {workers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-secondary">
                  No active workers found in network registry.
                </td>
              </tr>
            ) : (
              workers.map((w) => {
                const isAlive = (new Date().getTime() - new Date(w.last_heartbeat).getTime()) < 60000;
                const statusState = !isAlive ? 'dead' : w.status === 'running' ? 'running' : 'pending'; 
                
                return (
                  <TableRow key={w.id}>
                    <TableCell className="font-mono text-sm font-medium text-primary">{w.id}</TableCell>
                    <TableCell>
                      <Badge variant={statusState}>{statusState === 'pending' ? 'idle' : statusState === 'dead' ? 'offline' : 'busy'}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-secondary">
                      {w.current_job_id ? (
                        <span className="bg-white/5 px-2 py-0.5 rounded border border-border text-primary">{w.current_job_id}</span>
                      ) : (
                        <span className="opacity-50">---</span>
                      )}
                    </TableCell>
                    <TableCell className="text-primary font-medium">
                      {(w.jobs_completed || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-secondary flex items-center gap-2 mt-2">
                       <span className={`w-1.5 h-1.5 rounded-full ${isAlive ? 'bg-status-success' : 'bg-status-dead'}`}></span>
                       {new Date(w.last_heartbeat).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
