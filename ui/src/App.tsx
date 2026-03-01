import { useState, useEffect, useCallback } from 'react';
import type { GlobalStats, Job, WorkerStats, DLQJob } from './types';
import { Layout } from './layouts/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Queues } from './pages/Queues';
import { Jobs } from './pages/Jobs';
import { Workers } from './pages/Workers';
import { Scheduler } from './pages/Scheduler';
import { DLQ } from './pages/DLQ';
import { Settings } from './pages/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [workers, setWorkers] = useState<WorkerStats[]>([]);
  const [dlq, setDlq] = useState<DLQJob[]>([]);
  const [isLeader, setIsLeader] = useState<boolean>(false);
  
  const fetchData = useCallback(async () => {
    try {
      const [resJobs, resWorkers, resDlq, resSched] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/workers'),
        fetch('/api/dlq'),
        fetch('/api/scheduler')
      ]);
      
      const [dataJobs, dataWorkers, dataDlq, dataSched] = await Promise.all([
        resJobs.json(), resWorkers.json(), resDlq.json(), resSched.json()
      ]);

      if (dataJobs.jobs) setJobs(dataJobs.jobs);
      if (dataWorkers.workers) setWorkers(dataWorkers.workers);
      if (dataDlq.dlq) setDlq(dataDlq.dlq);
      if (dataSched.is_leader !== undefined) setIsLeader(dataSched.is_leader);

    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => { fetchData().catch(console.error); }, 0);
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleEnqueue = async (jobPayload: Partial<Job>) => {
    try {
      await fetch('/api/jobs/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobPayload)
      });
      fetchData();
      setActiveTab('Jobs'); // Redirect to jobs view after enqueue
    } catch (err) {
      console.error(err);
      alert('Failed to enqueue job');
    }
  };

  const totalJobs = jobs.length;
  const runningJobs = jobs.filter(j => j.status === 'running').length;
  const failedJobs = jobs.filter(j => j.status === 'failed').length;
  const deadJobs = dlq.length;

  const globalStats: GlobalStats = {
    totalJobs,
    runningJobs,
    failedJobs,
    deadJobs
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isLeader={isLeader}>
      {activeTab === 'Dashboard' && (
        <Dashboard stats={globalStats} jobs={jobs} workers={workers} dlq={dlq} isLeader={isLeader} />
      )}
      {activeTab === 'Queues' && (
        <Queues jobs={jobs} onEnqueueJob={handleEnqueue} />
      )}
      {activeTab === 'Jobs' && (
        <Jobs jobs={jobs} />
      )}
      {activeTab === 'Workers' && (
        <Workers workers={workers} />
      )}
      {activeTab === 'Scheduler' && (
        <Scheduler jobs={jobs} isLeader={isLeader} />
      )}
      {activeTab === 'DLQ' && (
        <DLQ dlq={dlq} />
      )}
      {activeTab === 'Settings' && (
        <Settings />
      )}
    </Layout>
  );
}
