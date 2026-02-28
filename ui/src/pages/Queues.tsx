import React, { useState } from 'react';
import type { Job } from '../types';
import { PlusCircle, ListTree } from 'lucide-react';

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

  // handleExpandQueue is omitted as routing state is not maintained

  const formatJson = () => {
    try {
      const obj = JSON.parse(formData.payload);
      setFormData({...formData, payload: JSON.stringify(obj, null, 2)});
    } catch {
      // Ignore if not currently valid JSON
    }
  };
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
      timeout: Number(formData.timeout) * 1000000, // naive ms to ns conversion
      retry_policy: { initial_interval: 1000000000, max_interval: 10000000000, max_attempts: Number(formData.max_retries) }
    };

    if (formData.cron_expr) {
      payloadObj.cron_expr = formData.cron_expr;
    }
    if (formData.dependencies) {
      payloadObj.dependencies = formData.dependencies.split(',').map(s => s.trim());
    }

    await onEnqueueJob(payloadObj);
    setLoading(false);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ListTree className="text-brand-500" /> Queue Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">Monitor and manage job backlog distribution across multiple logical queues.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 shadow-sm transition-all flex items-center gap-2"
        >
          <PlusCircle size={18} /> Enqueue Job
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {queues.map(q => (
          <div key={q.name} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
            <div className="p-6 border-b border-gray-100 flex-1">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200 font-mono">
                    {q.name}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50/50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{q.pending.toLocaleString()}</p>
                </div>
                <div className="bg-green-50/50 rounded-lg p-3">
                  <p className="text-xs text-green-600 uppercase font-semibold mb-1">Running</p>
                  <p className="text-2xl font-bold text-gray-900">{q.running.toLocaleString()}</p>
                </div>
                <div className="bg-orange-50/50 rounded-lg p-3">
                  <p className="text-xs text-orange-600 uppercase font-semibold mb-1">Failed</p>
                  <p className="text-2xl font-bold text-gray-900">{q.failed.toLocaleString()}</p>
                </div>
                <div className="bg-red-50/50 rounded-lg p-3">
                  <p className="text-xs text-red-600 uppercase font-semibold mb-1">Dead</p>
                  <p className="text-2xl font-bold text-gray-900">{q.dlq.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50/80 text-xs text-gray-500 border-t border-gray-100">
              Last Enqueued: {q.lastEnqueued !== '-' ? new Date(q.lastEnqueued).toLocaleString() : 'Never'}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <React.Fragment>
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Enqueue New Job</h3>
              </div>
              
              <form onSubmit={submitJob} className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Job Name (ID)</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Queue Selection</label>
                    <input type="text" value={formData.queue} onChange={e => setFormData({...formData, queue: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono" required />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex justify-between">
                    Payload Data (JSON)
                    <button type="button" onClick={formatJson} className="text-brand-600 text-[10px] lowercase tracking-normal bg-brand-50 px-2 py-0.5 rounded cursor-pointer border border-brand-100">Format Prettier</button>
                  </label>
                  <textarea 
                    value={formData.payload} 
                    onChange={e => setFormData({...formData, payload: e.target.value})} 
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none bg-[#1e1e1e] text-[#ce9178]" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">CRON Expression (Optional)</label>
                    <input type="text" placeholder="* * * * *" value={formData.cron_expr} onChange={e => setFormData({...formData, cron_expr: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Timeout (MS)</label>
                    <input type="number" min="1000" value={formData.timeout} onChange={e => setFormData({...formData, timeout: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Max Retries</label>
                    <input type="number" min="0" max="100" value={formData.max_retries} onChange={e => setFormData({...formData, max_retries: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Dependencies (Comma separated IDs)</label>
                    <input type="text" placeholder="job-1, job-2" value={formData.dependencies} onChange={e => setFormData({...formData, dependencies: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                  </div>
                </div>
              </form>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={submitJob}
                  disabled={loading}
                  className="px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-70 flex items-center gap-2 shadow-sm"
                >
                  {loading ? 'Submitting...' : 'Enqueue'}
                </button>
              </div>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};
