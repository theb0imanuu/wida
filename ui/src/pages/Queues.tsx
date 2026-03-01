import React, { useState } from 'react';
import type { Job } from '../types';
import { PlusCircle, ListTree } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface QueuesProps {
  jobs: Job[];
  onEnqueueJob: (jobData: Partial<Job>) => Promise<void>;
}

export const Queues: React.FC<QueuesProps> = ({ jobs, onEnqueueJob }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(() => ({
    name: `job-ui-${Date.now()}`,
    queue: 'default',
    payload: '{\n  "message": "Hello Wida from UI!"\n}',
    cron_expr: '',
    timeout: 30000,
    max_retries: 3,
    dependencies: ''
  }));
  const [loading, setLoading] = useState(false);

  // Derive Queues data
  const queueMap = new Map<string, { pending: number, running: number, failed: number, dlq: number, lastEnqueued: string }>();
  jobs.forEach(j => {
    if (!queueMap.has(j.queue)) {
      queueMap.set(j.queue, { pending: 0, running: 0, failed: 0, dlq: 0, lastEnqueued: new Date().toISOString() });
    }
    const q = queueMap.get(j.queue)!;
    if (j.status === 'pending') q.pending++;
    if (j.status === 'running') q.running++;
    if (j.status === 'failed') q.failed++;
  });
  const queues = Array.from(queueMap.entries()).map(([name, stats]) => ({ name, ...stats }));
  if (queues.length === 0) {
    queues.push({ name: 'default', pending: 0, running: 0, failed: 0, dlq: 0, lastEnqueued: '-' });
  }

  const submitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(formData.payload);
    } catch {
      alert("Invalid JSON in payload");
      setLoading(false);
      return;
    }

    const payloadObj: Partial<Job> = {
      id: formData.name,
      queue: formData.queue,
      payload: parsedPayload,
      status: 'pending',
      max_retries: Number(formData.max_retries),
      timeout: Number(formData.timeout) * 1000000, 
      retry_policy: { initial_interval: 1000000000, max_interval: 10000000000, max_attempts: Number(formData.max_retries) }
    };

    if (formData.cron_expr) payloadObj.cron_expr = formData.cron_expr;
    if (formData.dependencies) payloadObj.dependencies = formData.dependencies.split(',').map(s => s.trim());

    await onEnqueueJob(payloadObj);
    setLoading(false);
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-primary flex items-center gap-2 tracking-tight">
            <ListTree size={20} className="text-secondary" /> Queues Matrix
          </h2>
          <p className="text-sm text-secondary mt-1">Monitor throughput and latency per queue.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <PlusCircle size={16} className="mr-2" /> Enqueue Job
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {queues.map(q => (
          <Card key={q.name} className="flex flex-col group hover:border-[var(--text-secondary)] transition-colors cursor-default">
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-white/5 text-primary rounded border border-border">
                {q.name}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="flex flex-col">
                <p className="text-[10px] text-secondary uppercase font-semibold tracking-wider mb-1">Pending</p>
                <p className="text-2xl font-semibold text-primary">{q.pending.toLocaleString()}</p>
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] text-running uppercase font-semibold tracking-wider mb-1">Running</p>
                <p className="text-2xl font-semibold text-primary">{q.running.toLocaleString()}</p>
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] text-failed uppercase font-semibold tracking-wider mb-1">Failed</p>
                <p className="text-2xl font-semibold text-primary">{q.failed.toLocaleString()}</p>
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] text-dead uppercase font-semibold tracking-wider mb-1">Dead</p>
                <p className="text-2xl font-semibold text-primary">{q.dlq.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border text-[11px] text-secondary font-mono">
              Last Enqueued / {q.lastEnqueued !== '-' ? new Date(q.lastEnqueued).toLocaleTimeString() : 'Never'}
            </div>
          </Card>
        ))}
      </div>

      {/* Basic Enqueue Job Modal */}
      {showModal && (
        <React.Fragment>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 min-w-[320px]">
            <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-[var(--text-secondary)]">
              <h3 className="text-lg font-semibold text-primary mb-6">Enqueue New Job</h3>
              
              <form onSubmit={submitJob} className="flex-1 overflow-y-auto space-y-5 flex flex-col min-h-0">
                <div className="grid grid-cols-2 gap-5 shrink-0">
                  <div>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Job Name (ID)</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-black/20 border border-border rounded text-sm text-primary focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-secondary/50 font-mono" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Queue Selection</label>
                    <input type="text" value={formData.queue} onChange={e => setFormData({...formData, queue: e.target.value})} className="w-full px-3 py-2 bg-black/20 border border-border rounded text-sm text-primary focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-secondary/50 font-mono" required />
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-48 shrink-0">
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2 flex justify-between shrink-0">
                    Payload Data (JSON)
                  </label>
                  <textarea 
                    value={formData.payload} 
                    onChange={e => setFormData({...formData, payload: e.target.value})} 
                    className="w-full h-full px-3 py-3 border border-border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-[#0B0F14] text-[#E6EDF3] font-mono resize-none overflow-y-auto shadow-inner" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-5 shrink-0">
                  <div>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">CRON Expresion</label>
                    <input type="text" placeholder="* * * * *" value={formData.cron_expr} onChange={e => setFormData({...formData, cron_expr: e.target.value})} className="w-full px-3 py-2 bg-black/20 border border-border rounded text-sm text-primary font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-secondary/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Timeout (MS)</label>
                    <input type="number" min="1000" value={formData.timeout} onChange={e => setFormData({...formData, timeout: Number(e.target.value)})} className="w-full px-3 py-2 bg-black/20 border border-border rounded text-sm text-primary focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-secondary/50" required />
                  </div>
                </div>
              </form>
              
              <div className="mt-6 flex justify-end gap-3 shrink-0 pt-4 border-t border-border">
                <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={submitJob} disabled={loading}>{loading ? 'Submitting...' : 'Enqueue Job'}</Button>
              </div>
            </Card>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

